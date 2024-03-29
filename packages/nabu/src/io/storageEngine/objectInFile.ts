import { Document } from '@tashmet/tashmet';
import { IOSegment } from '../../interfaces.js';
import { makeFileFormat } from '../format/index.js';
import { FileBufferIO } from '../fileBuffer.js';
import { CompositeIO } from '../composite.js';

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
  readonly type = 'content';

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
      { $project: { _id: 0, content: { $arrayToObject: '$items' } } },
    ];
  }
}

export function makeObjectInFileIO({path, format, field, input, output}: Document) {
  if (typeof path !== 'string') {
    throw new Error('Failed create objectInFile, path is not a string');
  }

  const formatIO = makeFileFormat(format);

  return new CompositeIO(
    new FileBufferIO(path, formatIO, field), 
    new ObjectIO(),
    { type: 'content', input: input || [], output: output || [] }
  );
}
