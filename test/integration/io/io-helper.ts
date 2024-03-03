import Tashmet, { Document } from '@tashmet/tashmet';
import { makeFileFormat } from '../../../packages/nabu/dist/format/index.js';

export class IOHelper {
  constructor(private tashmet: Tashmet) {}

  readContent(content: string, format: string | Document) {
    const f = makeFileFormat(format);
    const pipeline: Document[] = [
      { $documents: [{ content }] },
      ...f.reader 
    ];
    return this.tashmet.db('test').aggregate(pipeline).next();
  }

  writeContent(content: Document, format: string | Document) {
    const f = makeFileFormat(format);
    const pipeline: Document[] = [
      { $documents: [{ content }] },
      ...f.writer 
    ];
    return this.tashmet.db('test').aggregate(pipeline).next() as Promise<Document>;
  }
}
