import ObjectID from 'bson-objectid';
import {Aggregator as MingoAggregator} from 'mingo/aggregator';
import {ChangeStreamDocument} from '../changeStream';
import {BulkWriteResult, Document, CollectionDriver, UpdateFilter, UpdateModel, Writer} from '../interfaces';

export class UpdateWriter<TSchema extends Document> extends Writer<TSchema, UpdateModel<TSchema>> {
  public constructor(
    driver: CollectionDriver<TSchema>,
    private single: boolean,
  ) { super(driver); }

  public async execute(
    {filter, update}: UpdateModel<TSchema>,
    eventCb: (change: ChangeStreamDocument) => void,
  ) {
    const input = await this.driver.find(filter, this.single ? {limit: 1} : {}).toArray();
    let result: Partial<BulkWriteResult> = {
      matchedCount: input.length,
      modifiedCount: input.length, // TODO: Not necessarily true
    }
    const output = this.updateDocuments(input, update);
    for (let i=0; i<input.length; i++) {
      await this.driver.replace(input[i], output[i]);
      if (eventCb) {
        eventCb({
          _id: new ObjectID(),
          operationType: 'update',
          ns: this.driver.ns,
          documentKey: output[i]._id,
          fullDocument: output[i],
        })
      }
    }
    return result;
  }

  protected updateDocuments(input: TSchema[], update: UpdateFilter<TSchema>): TSchema[] {
    const pipeline = Object.entries(update).reduce((acc, [k, v]) => {
      return acc.concat([{[k]: v}]);
    }, [] as Document[]);
    return new MingoAggregator(pipeline).run(input) as TSchema[];
  }
}