import {File, Pipe} from '@tashmet/nabu';
import {Stream} from '@tashmet/stream';
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
