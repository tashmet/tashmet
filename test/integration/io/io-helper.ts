import Tashmet, { Document } from '@tashmet/tashmet';
import { makeFileFormat } from '../../../packages/nabu/dist/format/index.js';
import { IOSegment } from '@tashmet/nabu';

export class IOHelper {
  constructor(private tashmet: Tashmet) {}

  readContent(content: string, format: string | Document) {
    const f = makeFileFormat(format);
    return this.input([{ content }], f).next() as Promise<Document>;
  }

  writeContent(content: Document, format: string | Document) {
    const f = makeFileFormat(format);
    return this.output([{ content }], f).next() as Promise<Document>;
  }

  input(documents: Document[], segment: IOSegment) {
    const pipeline: Document[] = [
      { $documents: documents },
      ...segment.input 
    ];
    return this.tashmet.db('test').aggregate(pipeline);
  }

  output(documents: Document[], segment: IOSegment) {
    const pipeline: Document[] = [
      { $documents: documents },
      ...segment.output 
    ];
    return this.tashmet.db('test').aggregate(pipeline);
  }
}
