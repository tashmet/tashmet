import Tashmet, { Document } from '@tashmet/tashmet';
import { makeFileFormat } from '../../../packages/nabu/dist/format/index.js';

export class IOHelper {
  constructor(private tashmet: Tashmet) {}

  readContent(content: string, format: string | Document) {
    const f = makeFileFormat(format);
    const pipeline: Document[] = [
      { $documents: [{ content }] },
      ...f.input 
    ];
    return this.tashmet.db('test').aggregate(pipeline).next();
  }

  writeContent(content: Document, format: string | Document) {
    const f = makeFileFormat(format);
    const pipeline: Document[] = [
      { $documents: [{ content }] },
      ...f.output 
    ];
    return this.tashmet.db('test').aggregate(pipeline).next() as Promise<Document>;
  }
}
