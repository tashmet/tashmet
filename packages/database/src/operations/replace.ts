import ObjectID from 'bson-objectid';
import {ChangeStreamDocument} from '../changeStream';
import {BulkWriteResult, Document, ReplaceOneModel, Writer} from '../interfaces';

export class ReplaceOneWriter<TSchema extends Document> extends Writer<TSchema, ReplaceOneModel<TSchema>> {
  public async execute(
    {filter, replacement, upsert}: ReplaceOneModel<TSchema>,
    eventCb?: (change: ChangeStreamDocument) => void
  ) {
    let result: Partial<BulkWriteResult> = {
      matchedCount: await this.driver.find(filter).count(),
    };

    if (result.matchedCount && result.matchedCount > 0) {
      const old = await this.driver.findOne(filter);
      if (old) {
        await this.driver.replace(old, replacement);
        if (!('_id' in replacement)) {
          Object.assign(replacement, {_id: old._id});
        }
      }
      Object.assign(result, {modifiedCount: 1})
    } else if (upsert) {
      await this.driver.insert(replacement as any);
      Object.assign(result, {upsertedIds: [replacement._id], upsertedCount: 1});
    }
    if (eventCb) {
      eventCb({
        _id: new ObjectID(),
        operationType: 'replace',
        ns: this.driver.ns,
        documentKey: replacement._id,
        fullDocument: replacement,
      });
    }
    return result;
  }
}
