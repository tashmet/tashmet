import {Aggregator as MingoAggregator} from 'mingo/aggregator';
import {ChangeStreamDocument} from '../changeStream';
import {BulkWriteResult, Document, UpdateFilter, UpdateModel, Writer} from '../interfaces';
import {ReplaceOneWriter} from './replace';

export class UpdateWriter<TSchema extends Document> implements Writer<UpdateModel<TSchema>> {
  public constructor(
    protected replaceOne: ReplaceOneWriter<TSchema>,
    protected single: boolean,
  ) {}

  public async execute(
    {filter, update, upsert}: UpdateModel<TSchema>,
    eventCb: (change: ChangeStreamDocument) => void,
  ) {
    const input = await this.driver.find(filter, this.single ? {limit: 1} : {}).toArray();
    let result: Partial<BulkWriteResult> = {
      matchedCount: input.length,
      modifiedCount: input.length, // TODO: Not necessarily true
    }
    for (const replacement of this.updateDocuments(input, update)) {
      await this.replaceOne.execute({
        filter: {_id: replacement._id},
        replacement,
        upsert
      }, change => eventCb({...change, operationType: 'update'}));
    }
    return result;
  }

  protected updateDocuments(input: TSchema[], update: UpdateFilter<TSchema>): TSchema[] {
    const pipeline = Object.entries(update).reduce((acc, [k, v]) => {
      return acc.concat([{[k]: v}]);
    }, [] as Document[]);
    return new MingoAggregator(pipeline).run(input) as TSchema[];
  }

  protected get driver() { return this.replaceOne.driver }
}