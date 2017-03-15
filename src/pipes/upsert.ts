import {Pipe, Collection} from '../interfaces';

export class UpsertPipe implements Pipe {
  private collection: Collection;

  public setCollection(collection: Collection): void {
    this.collection = collection;
  }

  public process(input: any, next: (output: any) => void): void {
    this.collection.upsert(input).then(next);
  }
}
