import { Document } from '@tashmet/tashmet';
import { BufferIO } from '../interfaces.js';
import { FileOptions } from './content.js';


export class FileBufferIO extends BufferIO {
  public constructor(
    public readonly path: string,
    private reader: Document,
    private writer: Document,
    private options: FileOptions
  ) { super(); }

  public get input(): Document[] {
    let index = this.options.includeArrayIndex;
    let merge: any[] = ['$items'];

    if (index) {
      merge.push({[index]: `$${index}`});
    }

    return [
      { $glob: { pattern: '$_id' } },
      { $project: {
        _id: 0,
        path: '$_id',
        stats: { $lstat: '$_id' },
        content: { $readFile: '$_id' },
      } },
      { $replaceRoot: { newRoot: { items: this.reader } } },
      { $unwind: { path: '$items', includeArrayIndex: index } },
      { $replaceRoot: { newRoot: { $mergeObjects: merge } } },
      { $set: { _id: this.options.id } }
    ];
  }

  public get output(): Document[] {
    let index = this.options.includeArrayIndex;

    let pipeline: Document[] = [];

    if (index) {
      pipeline = [
        { $sort: { [index]: 1 } },
        { $unset: index },
      ]
    };

    return pipeline.concat([
      { $unset: '_id' },
      { $group: { _id: this.path, content: { $push: '$$ROOT' } } },
      { $set: { content: this.writer } },
      { $writeFile: {
        content: '$content',
        to: '$_id',
        overwrite: true
      } }
    ]);
  }
}
