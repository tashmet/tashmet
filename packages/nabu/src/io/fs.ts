import { AggregatorFactory } from '@tashmet/engine';
import { ChangeStreamDocument, Document } from '@tashmet/tashmet';
import { ContentRule } from '../content.js';
import { IO, IOConfig } from '../io.js';


export function fs({lookup, scan, content}: IOConfig): (aggregatorFactory: AggregatorFactory) => IO {
  const inputPipeline: Document[] = [
    { $glob: { pattern: '$_id' } },
    {
      $project: {
        _id: 0,
        path: '$_id',
        stats: { $lstat: '$_id' },
        content: { $readFile: '$_id' },
      }
    },
    ...content.read,
  ];

  const path = (c: ChangeStreamDocument) => lookup(c.documentKey?._id as any);

  const outputPipeline: Document[] = [
    {
      $project: {
        _id: 0,
        content: {
          $cond: {
            if: { $ne: ["$operationType", "delete"] },
            then: "$fullDocument",
            else: { $literal: undefined }
          }
        },
        path: { $function: { body: path, args: [ "$$ROOT" ], lang: "js" }},
        mode: {
          $switch: {
            branches: [
              { case: { $eq: ['$operationType', 'insert'] }, then: 'create' },
              { case: { $eq: ['$operationType', 'replace'] }, then: 'update' },
              { case: { $eq: ['$operationType', 'delete'] }, then: 'delete' },
            ]
          }
        },
      },
    },
    ...content.write,
    {
      $writeFile: {
        content: {
          $cond: {
            if: { $ne: ['$mode', 'delete'] },
            then: '$content',
            else: null
          }
        },
        to: '$path',
        overwrite: { $ne: ['$mode', 'create'] },
      }
    }
  ]

  return (aggregatorFactory: AggregatorFactory) => new IO(aggregatorFactory, inputPipeline, outputPipeline, scan, lookup);
}

export function contentInDirectory(path: string, extension: string, content: ContentRule) {
  return fs({
    scan: `${path}/*${extension}`,
    lookup: id => `${path}/${id}${extension}`,
    content,
  });
}