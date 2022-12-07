import { Container, Document } from '@tashmet/tashmet';
import { FileAccess, File, ReadableFile, FileReader } from '@tashmet/nabu';
import fetch from 'isomorphic-fetch';


export class HttpReader implements FileReader {
  readonly pattern = /^https:/;

  public read(location: string | string[], options: Document = {}): AsyncGenerator<ReadableFile> {
    async function *reader() {
      for (const path of Array.isArray(location) ? location : [location]) {
        const resp = await fetch(path);

        let content;
        if (options.content === 'json') {
          content = await resp.json();
        } else if (options.content === 'text') {
          content = await resp.text();
        }

        yield {
          path,
          content: content,
          isDir: false,
        } as File;
      }
    }
    return reader();
  }
}

export default class NabuHttp {
  public static configure() {
    return (container: Container) => {
      return () => {
        const fa = container.resolve(FileAccess);
        fa.registerReader(new HttpReader());
      }
    }
  }
}
