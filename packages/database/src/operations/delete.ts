import ObjectID from 'bson-objectid';
import {ChangeStreamDocument} from '../changeStream';
import {BulkWriteResult, CollectionDriver, Document, DeleteModel, QueryOptions, Writer} from '../interfaces';

export class DeleteWriter<TSchema extends Document> implements Writer<DeleteModel<TSchema>> {
  public constructor(
    public readonly driver: CollectionDriver<TSchema>,
    private single: boolean,
  ) {}

  public async execute({filter}: DeleteModel<TSchema>, eventCb?: (change: ChangeStreamDocument) => void): Promise<Partial<BulkWriteResult>> {
    const options: QueryOptions = {
      projection: {_id: 1},
      limit: this.single ? 1 : undefined,
    };
    const matched = await this.driver.find(filter, options).toArray();
    if (matched.length !== 0) {
      await this.driver.delete(matched as any);

      if (eventCb) {
        for (const document of matched) {
          eventCb({
            _id: new ObjectID(),
            operationType: 'delete',
            ns: this.driver.ns,
            documentKey: document._id,
          });
        }
      }
    }
    return {deletedCount: matched.length};
  }
}
