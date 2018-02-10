import {Pipe} from '@ziggurat/ningal';
import {Collection} from '../interfaces';
import {Document} from '../models/document';

export class UpsertPipe implements Pipe<Document> {
  constructor(
    private collection: Collection
  ) {}

  public process(input: Document): Promise<Document> {
    return this.collection.upsert(input);
  }
}

export class RevisionUpsertPipe implements Pipe<Document> {
  constructor(
    private collection: Collection
  ) {}

  public async process(doc: Document): Promise<Document> {
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
