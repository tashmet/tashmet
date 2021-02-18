import * as stream from 'stream';

async function signalEnd(reader: stream.Readable) {
  return new Promise(resolve => {
    reader.once("end", resolve);
  });
}

async function signalReadable(reader: stream.Readable) {
  return new Promise(resolve => {
    reader.once("readable", resolve);
  });
}

export function makeGenerator<T>(
  readable: stream.Readable,
): AsyncGenerator<T, void, unknown> {

  return (async function* genFn() {
    await signalReadable(readable);
    const endPromise = signalEnd(readable);

    while (readable.readable) {
      let chunk;
      while (null !== (chunk = readable.read())) { 
        yield chunk;
      } 
      await Promise.race([endPromise, signalReadable(readable)]);
    }
  })();
}

export function makeStream<T>(generator: AsyncGenerator): stream.Readable {
  return stream.Readable.from(generator);
}

export function writeToStream(src: AsyncGenerator, dest: stream.Writable): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    makeStream(src).pipe(dest)
      .on('finish', resolve)
      .on('error', reject);
  });
}
