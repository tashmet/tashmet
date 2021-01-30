import {IOGate} from '@ziqquratu/pipe';
import * as fs from 'fs';
import {StreamFactory, readablePipeline, writablePipeline} from './util';

export class FileStreamFactory implements StreamFactory {
  public constructor(private path: string, private transforms: IOGate[]) {}

  public createReadable() {
    return readablePipeline(fs.createReadStream(this.path, {encoding: 'utf-8'}), this.transforms);
  }

  public createWritable() {
    return writablePipeline(fs.createWriteStream(this.path, {encoding: 'utf-8'}), this.transforms);
  }
}
