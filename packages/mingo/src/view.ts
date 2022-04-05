import {MingoStore} from './store';
import {
  ChangeSet,
  ChangeStreamDocument,
  Collection,
  Comparator,
  Document,
  locked,
  provider,
  readOnly,
  StoreConfig,
  ViewFactory,
  withMiddleware,
} from '@tashmet/tashmet';


@provider()
export class MingoViewFactory extends ViewFactory {
  public constructor(private comparator: Comparator) {
    super();
  }

  public createView<TSchema extends Document = any>(config: StoreConfig, viewOf: Collection<any>, pipeline: Document[] = []) {
    const store = MingoStore.fromConfig<TSchema>(config);
    const populate = async () => store.write(
      ChangeSet.fromInsert(await viewOf.aggregate<TSchema>(pipeline).toArray())
    );
    const locks: Promise<any>[] = [populate()];

    const handleChange = async (change: ChangeStreamDocument<any>) => {
      const newDocs = await viewOf.aggregate<TSchema>(pipeline).toArray();
      const oldDocs = await store.find({}).toArray();

      const cs = this.comparator.difference(oldDocs, newDocs);
      await store.write(cs);
      for (const change of cs.toChanges(config.ns)) {
        store.emit('change', change);
      }
    }

    const changeStream = viewOf.watch();

    changeStream.on('change', async change => {
      locks.push(handleChange(change));
    });
    return withMiddleware<TSchema>(store, [readOnly(store), locked(locks)]);
  }
}
