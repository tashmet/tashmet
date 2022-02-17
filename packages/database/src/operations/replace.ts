import {makeWriteChange, ChangeSet} from '../changeSet';
import {BulkWriteResult, Document, ReplaceOneModel, Writer} from '../interfaces';

export class ReplaceOneWriter<TSchema extends Document> extends Writer<TSchema, ReplaceOneModel<TSchema>> {
  public async execute({filter, replacement, upsert}: ReplaceOneModel<TSchema>) {
    let result: Partial<BulkWriteResult> = {
      matchedCount: await this.driver.find(filter).count(),
      modifiedCount: 0,
    };

    if (result.matchedCount && result.matchedCount > 0) {
      const old = await this.driver.findOne(filter);
      if (old) {
        if (!('_id' in replacement)) {
          Object.assign(replacement, {_id: old._id});
        }
        await this.driver.write(ChangeSet.fromReplace(old, replacement));
      }
      Object.assign(result, {modifiedCount: 1})
    } else if (upsert) {
      await this.driver.write(ChangeSet.fromInsert([replacement]));
      Object.assign(result, {upsertedIds: [replacement._id], upsertedCount: 1});
    }
    this.driver.emit('change', makeWriteChange('replace', replacement, this.driver.ns));

    return result;
  }
}
