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

  /** Additional aggregation steps applied after reading the data */
  input?: Document[];

  /** Additional aggregation steps applied before writing the data */
  output?: Document[];
}

export class ArrayInFileIO extends BufferIO {
  public constructor(
    public readonly path: string,
    private reader: (expr: any) => Document,
    private writer: (expr: any) => Document,
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
      { $documents: [{ _id: this.path }] },
      { $glob: { pattern: '$_id'} },
      { $project: { content: this.reader({ $readFile: '$_id' }) } },
      { $replaceRoot: { newRoot: { items: field } } },
      { $unwind: { path: '$items', includeArrayIndex: index } },
      { $replaceRoot: { newRoot: { $mergeObjects: merge } } },
    ]

    if (this.options.id) {
      pipeline.push(
        { $set: { _id: this.options.id } }
      );
    }

    return pipeline.concat(...this.options.input || [])
  }

  public get output(): Document[] {
    let index = this.options.includeArrayIndex;
    let pipeline: Document[] = this.options.output || [];

    if (index) {
      pipeline.push(
        { $sort: { [index]: 1 } },
        { $unset: index },
      );
    };

    if (this.options.id) {
      pipeline.push({ $unset: '_id' });
    }

    if (this.options.field) {
      pipeline.push(
        { $group: { _id: this.path, items: { $push: '$$ROOT' } } },
        { $set: {
          content: {
            $cond: {
              if: { $fileExists: this.path },
              then: this.reader({ $readFile: this.path }),
              else: {}
            }
          }
        } },
        { $set: { [`content.${this.options.field}`]: '$items' } },
      );
    } else {
      pipeline.push(
        { $group: { _id: this.path, content: { $push: '$$ROOT' } } },
      );
    }

    pipeline.push(
      { $writeFile: {
        content: this.writer('$content'),
        to: '$_id',
        overwrite: true
      } }
    );

    return pipeline;
  }
}
