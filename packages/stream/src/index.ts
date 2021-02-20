import * as stream from 'stream';
import {Generator, GeneratorSink} from '@ziqquratu/nabu';

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
  public static toGenerator<T>(readable: Readable) {
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
    return new Generator<T>(gen());
  }

  public static fromGenerator<T>(generator: AsyncGenerator): stream.Readable {
    return stream.Readable.from(generator);
  }

  public static toSink<T = any, TReturn = any>(dest: Writable): GeneratorSink<T, TReturn> {
    return generator => new Promise<TReturn>((resolve, reject) => {
      Stream.fromGenerator(generator).pipe(dest)
        .on('finish', resolve)
        .on('error', reject);
    });
  }
}
