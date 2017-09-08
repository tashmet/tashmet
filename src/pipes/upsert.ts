import {Pipe, Collection} from '../interfaces';
import * as Promise from 'bluebird';

export class UpsertPipe implements Pipe {
  constructor(
    private collection: Collection
  ) {}

  public process(input: any): Promise<any> {
    return this.collection.upsert(input);
  }
}

export class RevisionUpsertPipe implements Pipe {
  constructor(
    private collection: Collection
  ) {}

  public process(doc: any): Promise<any> {
    return this.collection.findOne({_id: doc._id})
      .then((old: any) => {
        if (!doc._revision) {
          doc._revision = old._revision + 1;
          return this.collection.upsert(doc);
        } else if (doc._revision !== old._revision) {
          return this.collection.upsert(doc);
        } else {
          return Promise.resolve(doc);
        }
      })
      .catch(() => {
        if (!doc._revision) {
          doc._revision = 1;
        }
        return this.collection.upsert(doc);
      });
  }
}
