import {Pipe} from '@ziqquratu/pipe';
import {File} from '@ziqquratu/nabu';
import {Stream} from '@ziqquratu/stream';
import Vinyl from 'vinyl';
import * as stream from 'stream';

export function fromVinyl(): Pipe<Vinyl, File> {
  return async vinyl => ({
    path: vinyl.path,
    content: Stream.toPipeline(vinyl.contents as stream.Readable),
    isDir: vinyl.isDirectory()
  });
}

export function toVinyl(): Pipe<File, Vinyl> {
  return async file => new Vinyl({
    path: file.path,
    contents: file.content,
  });
}
