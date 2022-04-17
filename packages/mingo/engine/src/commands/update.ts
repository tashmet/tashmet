import { Aggregator } from 'mingo';
import { MingoCommandHandler } from '../command';
import { Document } from '../interfaces';

export class UpdateCommandHandler extends MingoCommandHandler {
  public async execute({update: collName, updates, ordered}: Document) {
    let nModified = 0;
    let n = 0;
    let upserted: Document[] = [];

    for (const {q, u, upsert, multi, collation} of updates) {
      const pipeline = Array.isArray(u) ? u : Object.entries(u).reduce((acc, [k, v]) => {
        return acc.concat([{[k]: v}]);
      }, [] as Document[]);

      if (multi !== true) {
        pipeline.unshift({$limit: 1});
      }
      const output = new Aggregator([{$match: q || {}}, ...pipeline], {...this.options, collation})
        .run(this.store.documents(collName)) as Document[];

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
