import {intersection} from 'mingo/util';
import {provider} from '@tashmet/core';
import {MemoryStore} from './store';
import {
  ChangeSet,
  ChangeStreamDocument,
  Document,
  Intersect,
  withMiddleware,
  readOnly,
  locked,
  Store,
  StoreConfig,
  ViewFactory,
} from '@tashmet/database';


@provider()
export class MemoryViewFactory extends ViewFactory {
  public createView<TSchema extends Document = any>(config: StoreConfig, viewOf: Store<any>, pipeline: Document[] = []) {
    const store = MemoryStore.fromConfig<TSchema>(config);
    const populate = async () => store.write(
      ChangeSet.fromInsert(await viewOf.aggregate<TSchema>(pipeline).toArray())
    );
    const locks: Promise<any>[] = [populate()];

    const handleChange = async (change: ChangeStreamDocument<any>) => {
      const newDocs = await viewOf.aggregate<TSchema>(pipeline).toArray();
      const oldDocs = await store.find({}).toArray();

      const cs = ChangeSet.fromDiff(oldDocs, newDocs, intersection as Intersect<TSchema>);
      await store.write(cs);
      for (const change of cs.toChanges(config.ns)) {
        store.emit('change', change);
      }
    }

    viewOf.on('change', async change => {
      locks.push(handleChange(change));
    });
    return withMiddleware<TSchema>(store, [readOnly(store), locked(locks)]);
  }
}
