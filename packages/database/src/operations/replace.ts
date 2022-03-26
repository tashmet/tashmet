import {makeWriteChange, ChangeSet} from '../changeSet';
import {BulkWriteResult, Document, ReplaceOneModel, Writer} from '../interfaces';

export class ReplaceOneWriter<TSchema extends Document> extends Writer<TSchema, ReplaceOneModel<TSchema>> {
  public async execute({filter, replacement, upsert}: ReplaceOneModel<TSchema>) {
    let result: Partial<BulkWriteResult> = {
      matchedCount: await this.store.find(filter).count(),
      modifiedCount: 0,
    };

    if (result.matchedCount && result.matchedCount > 0) {
      const old = await this.store.find(filter).limit(1).next();
      if (old) {
        if (!('_id' in replacement)) {
          Object.assign(replacement, {_id: old._id});
        }
        await this.store.write(ChangeSet.fromReplace(old, replacement));
      }
      Object.assign(result, {modifiedCount: 1})
    } else if (upsert) {
      await this.store.write(ChangeSet.fromInsert([replacement]));
      Object.assign(result, {upsertedIds: [replacement._id], upsertedCount: 1});
    }
    this.store.emit('change', makeWriteChange('replace', replacement, this.store.ns));

    return result;
  }
}
