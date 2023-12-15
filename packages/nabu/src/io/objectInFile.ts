import { Document } from '@tashmet/tashmet';
import { FileFormat, BufferIO } from '../interfaces.js';
import { makeFileFormat } from '../format/index.js';

export interface ObjectInFileOptions {
  /**
   * Optional name of a field within the parsed file contents where the object resides.
   * 
   * If omitted the object is present at the root.
   */
  field?: string;

  /** Additional aggregation steps applied after reading the data */
  input?: Document[];

  /** Additional aggregation steps applied before writing the data */
  output?: Document[];
}

export class ObjectInFileIO extends BufferIO {
  static fromConfig({path, format, ...options}: Document) {
    if (typeof path !== 'string') {
      throw new Error('Failed create objectInFile, path is not a string');
    }

    return new ObjectInFileIO(path, makeFileFormat(format), options);
  }

  public constructor(
    public readonly path: string,
    private format: FileFormat,
    private options: ObjectInFileOptions = {}
  ) { super(); }

  get input(): Document[] {
    const field = this.options.field ? `$content.${this.options.field}` : '$content';

    const pipeline: Document[] = [
      { $documents: [{ _id: this.path }] },
      { $glob: { pattern: '$_id'} },
      { $project: { content: this.format.reader({ $readFile: '$_id' }) } },
      { $set: { content: { $objectToArray: field } } },
      { $unwind: '$content' },
      { $replaceRoot: { newRoot: { $mergeObjects: [{ _id: '$content.k', }, '$content.v'] } } },
    ];

    return pipeline.concat(...this.options.input || []);
  }

  get output(): Document[] {
    const pipeline: Document[] = this.options.output || [];

    pipeline.push(
      { $project: { _id: 0, k: '$_id', v: '$$ROOT' } },
      { $unset: 'v._id' },
      { $group: { _id: this.path, items: { $push: '$$ROOT' } } },
    );

    if (this.options.field) {
      pipeline.push(
        { $set: {
          content: {
            $cond: {
              if: { $fileExists: this.path },
              then: this.format.reader({ $readFile: this.path }),
              else: {}
            }
          }
        } },
        { $set: { [`content.${this.options.field}`]: { $arrayToObject: '$items' } } },
      );
    } else {
      pipeline.push(
        { $set: { content: { $arrayToObject: '$items' } } }
      );
    }

    pipeline.push(
      { $writeFile: {
        content: this.format.writer('$content'),
        to: '$_id',
        overwrite: true
      } }
    );

    return pipeline;
  }
}
