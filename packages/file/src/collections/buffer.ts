import {Collection, withMiddleware, changeObserver, DatabaseChange} from '@tashmit/database';

export type BufferWrite = (change: DatabaseChange) => Promise<void>;

export const buffer = (cache: Collection, write: BufferWrite) =>
  withMiddleware(cache, [writer(write)]);

export const writer = (write: BufferWrite) => changeObserver(async change => {
  const {action, data, collection} = change;

  const rollback = () => {
    switch (action) {
      case 'insert': return collection.deleteMany({_id: {$in: data.map(d => d._id)}});
      case 'delete': return collection.insertMany(data);
      case 'replace': return collection.replaceOne({_id: data[1]}, data[0]);
    }
  }

  try {
    await write(change);
  } catch (err) {
    await rollback();
  }
});
