import {Fetch, HttpRestLayer} from './interfaces';

export class DefaultHttpRestLayer implements HttpRestLayer {
  public constructor(
    public readonly basePath: string,
    private path: (collection: string) => string,
    private fetch: Fetch,
    private headers: Record<string, string> = {},
  ) {}

  public async get(collection: string, queryString: string = '', head: boolean = false) {
    const method = head ? 'HEAD' : 'GET';
    const queryPath = queryString !== ''
      ? this.resolvePath(collection) + '?' + queryString
      : this.resolvePath(collection);

    return this.fetch(queryPath, {method, headers: this.headers});
  }

  public async put(collection: string, doc: any, id: string) {
    return this.send('PUT', `${this.resolvePath(collection)}/${id}`, doc);
  }

  public async post(collection: string, doc: any) {
    return this.send('POST', this.resolvePath(collection), doc);
  }

  public async delete(collection: string, id: any) {
    const resp = await this.fetch(this.resolvePath(collection) + '/' + id, {
      method: 'DELETE',
      headers: this.makeHeaders(),
    });
    if (!resp.ok) {
      throw new Error(await this.errorMessage(resp));
    }
    return resp;
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

  private resolvePath(collection: string) {
    const path = this.basePath + this.path(collection);
    //console.log(path);
    return path;
  }
}
