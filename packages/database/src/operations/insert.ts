import ObjectID from 'bson-objectid';
import {ChangeStreamDocument} from '../changeStream';
import {Document, InsertOneModel, Writer} from '../interfaces';

export class InsertOneWriter<TSchema extends Document> extends Writer<TSchema, InsertOneModel<TSchema>> {
  public async execute(
    {document}: InsertOneModel<TSchema>,
    eventCb?: (change: ChangeStreamDocument) => void,
  ) {
    await this.driver.insert(document);

    if (eventCb) {
      eventCb({
        _id: new ObjectID(),
        operationType: 'insert',
        ns: this.driver.ns,
        documentKey: document._id,
        fullDocument: document,
      });
    }
    return {insertedCount: 1, insertedIds: [document._id]}
  }
}
