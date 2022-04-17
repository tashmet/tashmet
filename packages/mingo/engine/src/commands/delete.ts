import * as Mingo from 'mingo';
import { Document } from '../interfaces';
import { MingoCommandHandler } from '../command';

export class DeleteCommandHandler extends MingoCommandHandler {
  public async execute({delete: collName, deletes}: Document) {
    let n=0;
    const coll = this.store.documents(collName);

    for (const {q, limit, collation} of deletes) {
      const cursor = new Mingo.Query(q, {...this.options, collation}).find(coll);
      const size = coll.length;
    
      if (typeof limit === 'number') {
        cursor.limit(limit);
      }

      const matched = cursor.all() as Document[];

      if (matched.length > 0) {
        for (const doc of matched) {
          this.store.delete(collName, doc._id);
        }
      }

      n += size - matched.length;
    }

    return {n, ok: 1};
  }
}
