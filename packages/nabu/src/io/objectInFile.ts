import { Document } from '@tashmet/tashmet';
import { IOSegment, BufferIO } from '../interfaces.js';
import { makeFileFormat } from '../format/index.js';
import { FileIO } from '../format/file.js';
import { CompositeIO } from '../format/common.js';

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

export class ObjectIO implements IOSegment {
  get input(): Document[] {
    return [
      { $set: { content: { $objectToArray: '$content' } } },
      { $unwind: '$content' },
      { $replaceRoot: { newRoot: { $mergeObjects: [{ _id: '$content.k', }, '$content.v'] } } },
    ];
  }

  get output(): Document[] {
    return [
      { $project: { _id: 0, k: '$_id', v: '$$ROOT' } },
      { $unset: 'v._id' },
      { $group: { _id: 1, items: { $push: '$$ROOT' } } },
      { $set: { content: { $arrayToObject: '$items' } } },
    ];
  }
}

export function makeObjectInFileIO({path, format, field}: Document) {
  if (typeof path !== 'string') {
    throw new Error('Failed create objectInFile, path is not a string');
  }

  const formatIO = makeFileFormat(format);

  const io = new CompositeIO(
    new FileIO(path, formatIO, field), 
    new ObjectIO()
  );

  return new BufferIO(io);
}
