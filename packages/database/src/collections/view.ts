import {Factory} from '@tashmit/core';
import {withMiddleware} from '../middleware';
import {CollectionFactory, ViewCollectionConfig} from '../interfaces';
import {locked, readOnly} from '../middleware';
import {ChangeSet} from '../changeSet';
import {ChangeStreamDocument, memory, OptionalId} from '..';


export function view<T = any>(config: ViewCollectionConfig): CollectionFactory<T> {
  return Factory.of(({name, database, container}) => {
    const viewOf = database.collection(config.viewOf);
    const collection = memory<T>().resolve(container)({name, database});
    const cs = viewOf.watch();
    const populate = async () => collection.insertMany(
      await viewOf.aggregate<OptionalId<T>>(config.pipeline)
    );
    const locks: Promise<any>[] = [populate()];

    const handleChange = async (change: ChangeStreamDocument<any>) => {
      const newDocs = await viewOf.aggregate<T>(config.pipeline);
      const oldDocs = await collection.find({}).toArray();

      await collection.bulkWrite(ChangeSet.fromDiff(oldDocs, newDocs).toOperations());
    }

    cs.on('change', async change => {
      locks.push(handleChange(change));
    });
    return withMiddleware<T>(collection, [readOnly, locked(locks)]);
  });
}
