import { CollationOptions } from '@tashmet/tashmet';
import { Aggregator } from 'mingo';
import { MingoCommandHandler } from '../command';
import { Document } from '../interfaces';

export class UpdateCommandHandler extends MingoCommandHandler {
  public async execute({update: collName, updates, ordered}: Document) {
    let nModified = 0;
    let n = 0;
    let upserted: Document[] = [];

    const aggregate = (pipeline: Document[], collation?: CollationOptions): Document[] => {
      return new Aggregator(pipeline, {...this.options, collation})
        .run(this.store.documents(collName)) as Document[];
    }

    for (const {q, u, upsert, multi, collation} of updates) {
      let pipeline: Document[] = [];

      if (Array.isArray(u)) {
        pipeline = u;
      } else if (Object.keys(u)[0].charAt(0) === '$') {
        pipeline = Object.entries(u).reduce<Document[]>((acc, [k, v]) => acc.concat([{[k]: v}]), []);
      } else {
        pipeline = [{$set: u}];
      }

      if (multi !== true) {
        pipeline.unshift({$limit: 1});
      }
      let output = aggregate([{$match: q || {}}, ...pipeline], collation);

      if (output.length === 0 && upsert) {
        output = aggregate(pipeline, collation);
      }

      for (const doc of output) {
        if (this.store.documents(collName).findIndex(o => o._id === doc._id) === -1) {
          if (upsert) {
            await this.store.insert(collName, doc);
            upserted.push({index: upserted.length, _id: doc._id});
            n++;
          }
        } else {
          await this.store.replace(collName, doc._id, doc);
          n++;
          nModified++;
        }
      }
    }
    return {ok: 1, n, nModified, upserted};
  }
}
