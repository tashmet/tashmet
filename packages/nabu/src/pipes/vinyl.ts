import {StreamFactory} from './util';
import {IOGate} from '@ziqquratu/pipe';
import * as vfs from 'vinyl-fs';
import * as stream from 'stream';

export class VinylStreamFactory implements StreamFactory {
  public constructor(private globs: string | string[], private transforms: IOGate[] = []) {}

  public createReadable() {
    return vfs.src(this.globs) as stream.Duplex;
  }

  public createWritable() {
    return new stream.Writable();
    // return writablePipeline(fs.createWriteStream(this.path, {encoding: 'utf-8'}), this.transforms);
  }
}