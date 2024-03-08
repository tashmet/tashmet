import { Document } from '@tashmet/tashmet';
import { BufferIO } from '../interfaces.js';
import { IOSegment } from '../interfaces.js';
import { makeFileFormat } from '../format/index.js';
import { FileIO } from '../format/file.js';
import { CompositeIO } from '../format/common.js';

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

export class ArrayIO implements IOSegment {
  constructor(private index: string | undefined, private id: string | Document | undefined) {}

  get input(): Document[] {
    const root = this.index ? { $mergeObjects: ['$content', { [this.index]: `$${this.index}`}] } : '$content';

    const pipeline: Document[] = [
      { $unwind: { path: '$content', includeArrayIndex: this.index } },
      { $replaceRoot: { newRoot: root } },
    ];

    if (this.id) {
      pipeline.push(
        { $set: { _id: this.id } }
      );
    }
    return pipeline;
  }

  get output(): Document[] {
    const pipeline: Document[] = [];

    if (this.index) {
      pipeline.push(
        { $sort: { [this.index]: 1 } },
        { $unset: this.index },
      );
    }

    if (this.id) {
      pipeline.push({ $unset: '_id' });
    }

    return pipeline.concat([
      { $group: { _id: 1, content: { $push: '$$ROOT' } } },
    ]);
  }
}

export function makeArrayInFileIO({path, format, includeArrayIndex, field, id}: Document) {
  if (typeof path !== 'string') {
    throw new Error('Failed create arrayInFile, path is not a string');
  }

  const formatIO = makeFileFormat(format);

  const io = new CompositeIO(
    new FileIO(path, formatIO, field), 
    new ArrayIO(includeArrayIndex, id)
  );

  return new BufferIO(io);
}
