import * as stream from 'stream';
import {Pipeline, PipelineSink} from '@tashmet/nabu';

type Readable = stream.Readable | NodeJS.ReadStream | NodeJS.ReadWriteStream;
type Writable = stream.Writable | NodeJS.WriteStream | NodeJS.ReadWriteStream;

async function signalEnd(reader: stream.Readable | NodeJS.ReadWriteStream) {
  return new Promise(resolve => {
    reader.once("end", resolve);
  });
}

async function signalReadable(reader: Readable) {
  return new Promise(resolve => {
    reader.once("readable", resolve);
  });
}

export class Stream {
  public static toPipeline<T>(readable: Readable) {
    async function* gen() {
      await signalReadable(readable);
      const endPromise = signalEnd(readable);

      while (readable.readable) {
        let chunk;
        while (null !== (chunk = readable.read())) {
          yield chunk;
        }
        await Promise.race([endPromise, signalReadable(readable)]);
      }
    }
    return new Pipeline<T>(gen());
  }

  public static fromPipeline<T>(pipeline: Pipeline): stream.Readable {
    return stream.Readable.from(pipeline);
  }

  public static toSink<T = any, TReturn = any>(dest: Writable): PipelineSink<T, TReturn> {
    return pipeline => new Promise<TReturn>((resolve, reject) => {
      Stream.fromPipeline(pipeline).pipe(dest)
        .on('finish', resolve)
        .on('error', reject);
    });
  }
}
