import { ChangeStreamDocument, Document } from '@tashmet/tashmet';
import Nabu from '../index.js';
import { IO, IOConfig } from '../io.js';


export function fs({lookup, scan, content}: IOConfig): (nabu: Nabu) => IO {
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

  return (nabu: Nabu) => new IO(nabu, inputPipeline, outputPipeline, scan, lookup);
}