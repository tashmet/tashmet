import {Fetch} from './interfaces';

export class HttpRestLayer {
  public constructor(
    public readonly basePath: string,
    private fetch: Fetch,
    private headers: Record<string, string> = {},
  ) {}

  public async get(path: string, queryString: string = '', head: boolean = false) {
    const method = head ? 'HEAD' : 'GET';
    const queryPath = queryString !== ''
      ? this.resolvePath(path) + '?' + queryString
      : this.resolvePath(path);

    return this.fetch(queryPath, {method, headers: this.headers});
  }

  public async put(path: string, doc: any, id: string) {
    return this.send('PUT', `${this.resolvePath(path)}/${id}`, doc);
  }

  public async post(path: string, doc: any) {
    return this.send('POST', this.resolvePath(path), doc);
  }

  public async delete(path: string, id: any) {
    const resp = await this.fetch(this.resolvePath(path) + '/' + id, {
      method: 'DELETE',
      headers: this.makeHeaders(),
    });
    if (!resp.ok) {
      throw new Error(await this.errorMessage(resp));
    }
  }

  private async send(method: 'POST' | 'PUT', path: string, doc: any) {
    const resp = await this.fetch(path, {
      body: JSON.stringify(doc),
      method,
      headers: this.makeHeaders({
        'content-type': 'application/json'
      }),
    });
    if (resp.ok) {
      return resp.json();
    } else {
      throw new Error(await this.errorMessage(resp));
    }
  }

  private makeHeaders(headers?: Record<string, string>) {
    return Object.assign({}, headers, this.headers);
  }

  private async errorMessage(resp: Response): Promise<string> {
    try {
      return (await resp.json()).message;
    } catch (err) {
      try {
        return await resp.text();
      } catch (err) {
        return resp.statusText;
      }
    }
  }

  private resolvePath(path: string) {
    return this.basePath + path;
  }
}
