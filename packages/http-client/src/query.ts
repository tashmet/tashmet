import { Document, Queryable } from '@tashmet/engine';
import { QuerySerializer } from '@tashmet/qs-builder';
import { HttpRestLayer } from './common';

export class HttpQueryable implements Queryable {
  public constructor(
    private querySerializer: QuerySerializer,
    private restLayer: HttpRestLayer
  ) { }

  public async executeQuery(collName: string, query: Document): Promise<Document[]> {
    const resp = await this.restLayer.get(collName, this.querySerializer.serialize(query), false);
    return resp.json();
  }
}
