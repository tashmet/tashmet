import ObjectID from 'bson-objectid';
import {ChangeStreamDocument} from '../changeStream';
import {BulkWriteResult, CollectionDriver, Document, InsertOneModel, ReplaceOneModel, Writer} from '../interfaces';

export class ReplaceOneWriter<TSchema extends Document> implements Writer<ReplaceOneModel<TSchema>> {
  public constructor(
    public readonly driver: CollectionDriver<TSchema>,
    private insertOne: Writer<InsertOneModel<TSchema>>,
  ) {}

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
        if (eventCb) {
          eventCb({
            _id: new ObjectID(),
            operationType: 'replace',
            ns: this.driver.ns,
            documentKey: old._id,
            fullDocument: replacement,
          });
        }
      }
      return {...result, modifiedCount: 1};
    } else if (upsert) {
      const {insertedIds} = await this.insertOne.execute({document: replacement as any}, eventCb);
      return {...result, upsertedIds: insertedIds, upsertedCount: 1};
    }
    return result;
  }
}
