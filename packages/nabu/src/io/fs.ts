import { AggregatorFactory } from '@tashmet/engine';
import { ChangeStreamDocument, Document } from '@tashmet/tashmet';
import { BufferIO, BufferIOFactory, StreamIO, StreamIOFactory } from '../io.js';


export class FileStreamFactory extends StreamIOFactory {
  public createIO(aggregatorFactory: AggregatorFactory): StreamIO {
    return new StreamIO(aggregatorFactory, this.inputPipeline, this.outputPipeline, this.config.scan, this.config.lookup);
  }

  public get inputPipeline(): Document[] {
    return [
      { $glob: { pattern: '$_id' } },
      {
        $project: {
          _id: 0,
          path: '$_id',
          stats: { $lstat: '$_id' },
          content: { $readFile: '$_id' },
        }
      },
      ...this.config.content.read,
    ];
  }

  public get outputPipeline(): Document[] {
    const path = (c: ChangeStreamDocument) => this.config.lookup(c.documentKey?._id as any);

    return [
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
      ...this.config.content.write,
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
  }
}

export class FileBufferFactory extends BufferIOFactory {
  public createIO(aggregatorFactory: AggregatorFactory): BufferIO {
    return new BufferIO(aggregatorFactory, this.inputPipeline, this.outputPipeline, this.config.path);
  }

  public get inputPipeline(): Document[] {
    return [
      { $glob: { pattern: '$_id' } },
      { $project: {
          _id: 0,
          path: '$_id',
          stats: { $lstat: '$_id' },
          content: { $readFile: '$_id' },
      } },
      { $replaceRoot: { newRoot: { items: this.config.reader} } },
      { $unwind: { path: '$items', includeArrayIndex: '_id' } },
      { $replaceRoot: { newRoot: { $mergeObjects: [{_id: '$_id'}, '$items'] } } }
    ];
  }

  public get outputPipeline(): Document[] {
    return [
      { $sort: { _id: 1 } },
      { $unset: '_id' },
      { $group: { _id: this.config.path, content: { $push: '$$ROOT' } } },
      { $set: { content: this.config.writer } },
      { $writeFile: {
          content: '$content',
          to: '$_id',
          overwrite: true
      } }
    ];
  }
}
