import {Pipe, Collection} from '../interfaces';
import * as Promise from 'bluebird';

export class UpsertPipe implements Pipe {
  private collection: Collection;

  public setCollection(collection: Collection): void {
    this.collection = collection;
  }

  public process(input: any): Promise<any> {
    return this.collection.upsert(input);
  }
}
