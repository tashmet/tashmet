import { Container, Document } from '@tashmet/tashmet';
import { FileAccess, File, ReadableFile, FileReader } from '@tashmet/nabu';
import fetch from 'isomorphic-fetch';

export interface HttpOptions {
  content?: (resp: Response) => any | Promise<any>;

  headers?: Record<string, any>;
}

export interface HttpConfig {
  rules?: (HttpOptions & {match: RegExp})[]
}

export class HttpReader implements FileReader {
  readonly pattern = /^https:/;

  public constructor(private config: HttpConfig) {}

  public read(location: string | string[], options: Document = {}): AsyncGenerator<ReadableFile> {
    return this.reader(location);
  }

  private async request(path: string) {
    let init: RequestInit = {};

    for (const {match, headers} of this.config.rules || []) {
      if (match.test(path)) {
        init.headers = headers || {};
      }
    }

    return fetch(path, init);
  }

  private async *reader(location: string | string[]) {
    for (const path of Array.isArray(location) ? location : [location]) {
      const resp = await this.request(path);
      let content: any;

      const contentType = resp.headers.get("Content-Type");
      if (contentType && (contentType.indexOf("application/json") !== -1 || contentType.indexOf("application/javascript") !== -1)) {
        content = await resp.json();
      } else {
        content = await resp.text();
      }

      yield { path, content, isDir: false } as File;
    }
  }
}

export default class NabuHttp {
  public static configure(config: HttpConfig = {}) {
    return (container: Container) => {
      return () => {
        const fa = container.resolve(FileAccess);
        fa.registerReader(new HttpReader(config));
      }
    }
  }
}
