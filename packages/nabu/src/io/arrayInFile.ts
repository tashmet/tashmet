import { Document } from '@tashmet/tashmet';
import { BufferIO } from '../interfaces.js';

export interface ArrayInFileOptions {
  id?: string | Document;

  /**
   * Include the index of the document as a field
   */
  includeArrayIndex?: string;

  /**
   * Optional name of a field within the parsed file contents where the array resides.
   * 
   * If omitted the array is present at the root.
   */
  field?: string;
}

export class ArrayInFileIO extends BufferIO {
  public constructor(
    public readonly path: string,
    private reader: Document,
    private writer: Document,
    private options: ArrayInFileOptions = {}
  ) { super(); }

  public get input(): Document[] {
    let index = this.options.includeArrayIndex;
    let merge: any[] = ['$items'];
    const field = this.options.field ? `$content.${this.options.field}` : '$content';

    if (index) {
      merge.push({[index]: `$${index}`});
    }

    const pipeline: Document[] = [
      { $project: { content: { $readFile: '$_id' } } },
      { $set: { content: this.reader }},
      { $replaceRoot: { newRoot: { items: field } } },
      { $unwind: { path: '$items', includeArrayIndex: index } },
      { $replaceRoot: { newRoot: { $mergeObjects: merge } } },
    ]

    if (this.options.id) {
      pipeline.push(
        { $set: { _id: this.options.id } }
      );
    }

    return pipeline;
  }

  public get output(): Document[] {
    let index = this.options.includeArrayIndex;

    let pipeline: Document[] = [];

    if (index) {
      pipeline.push(
        { $sort: { [index]: 1 } },
        { $unset: index },
      );
    };

    if (this.options.field) {
      pipeline.push(
        { $unset: '_id' },
        { $group: { _id: this.path, items: { $push: '$$ROOT' } } },
        { $set: { content: { $readFile: this.path } } },
        { $set: { content: this.reader } },
        { $set: { [`content.${this.options.field}`]: '$items' } },
      );
    } else {
      pipeline.push(
        { $unset: '_id' },
        { $group: { _id: this.path, content: { $push: '$$ROOT' } } },
      );
    }

    return pipeline.concat([
      { $set: { content: this.writer } },
      { $writeFile: {
        content: '$content',
        to: '$_id',
        overwrite: true
      } }
    ]);
  }
}
