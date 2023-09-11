import * as stream from 'stream';

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
    return async function* gen() {
      const endPromise = signalEnd(readable);
      await Promise.race([endPromise, signalReadable(readable)]);
      let finished: boolean = false;

      endPromise.then(() => {
        finished = true;
      });

      while (!finished) {
        let chunk;
        while (null !== (chunk = readable.read())) {
          yield chunk;
        }
        await Promise.race([endPromise, signalReadable(readable)]);
      }
    }
  }

  public static fromGenerator<T>(generator: AsyncGenerator): stream.Readable {
    return stream.Readable.from(generator);
  }

  public static toSink<T = any, TReturn = any>(dest: Writable) {
    return (generator: AsyncGenerator<T, TReturn>) => new Promise<TReturn>((resolve, reject) => {
      Stream.fromGenerator(generator).pipe(dest)
        .on('finish', resolve)
        .on('error', reject);
    });
  }
}
