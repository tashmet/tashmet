import {Pipe} from '@ziggurat/ningal';
import {Collection} from '../interfaces';

export class RevisionUpsertPipe<T> implements Pipe<T> {
  constructor(
    private collection: Collection<T>
  ) {}

  public async process(doc: any): Promise<T> {
    try {
      let old = await this.collection.findOne({_id: doc._id});
      if (!doc._revision) {
        doc._revision = old._revision + 1;
        return this.collection.upsert(doc);
      } else if (doc._revision !== old._revision) {
        return this.collection.upsert(doc);
      } else {
        return Promise.resolve(doc);
      }
    } catch (e) {
      if (!doc._revision) {
        doc._revision = 1;
      }
      return this.collection.upsert(doc);
    }
  }
}
