import { Document } from '@tashmet/tashmet';
import { BufferIO } from '../interfaces.js';
import { FileFormat } from '../interfaces.js';
import { makeFileFormat } from '../format/index.js';
import * as fs from 'fs';

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
  static fromConfig({path, format, ...options}: Document) {
    if (typeof path !== 'string') {
      throw new Error('Failed create arrayInFile, path is not a string');
    }

    return new ArrayInFileIO(path, makeFileFormat(format), options);
  }

  public constructor(
    public readonly path: string,
    private format: FileFormat,
    private options: ArrayInFileOptions = {}
  ) { super(); }

  get input(): Document[] {
    const index = this.options.includeArrayIndex;
    const merge: any[] = ['$items'];
    const field = this.options.field ? `$content.${this.options.field}` : '$content';

    if (index) {
      merge.push({[index]: `$${index}`});
    }

    const pipeline: Document[] = [
      { $documents: [{ _id: this.path }] },
      { $glob: { pattern: '$_id'} },
      { $project: { content: { $readFile: '$_id' } } },
      ...this.format.reader,
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

  get output(): Document[] {
    const index = this.options.includeArrayIndex;
    const pipeline: Document[] = this.options.output || [];

    if (index) {
      pipeline.push(
        { $sort: { [index]: 1 } },
        { $unset: index },
      );
    }

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
              then: { $readFile: this.path },
              else: null,
            }
          }
        } },
        ...this.format.reader,
        { $set: { [`content.${this.options.field}`]: '$items' } },
      );
    } else {
      pipeline.push(
        { $group: { _id: this.path, content: { $push: '$$ROOT' } } },
      );
    }

    pipeline.push(
      ...this.format.writer,
      { $writeFile: {
        content: '$content',
        to: '$_id',
        overwrite: true
      } }
    );

    return pipeline;
  }

  async drop() {
    if (this.options.field === undefined && fs.existsSync(this.path)) {
      fs.rmSync(this.path);
    }
  }
}
