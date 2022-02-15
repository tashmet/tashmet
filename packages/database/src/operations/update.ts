import {Aggregator as MingoAggregator} from 'mingo/aggregator';
import {makeWriteChange, ChangeSet} from '../changeSet';
import {BulkWriteResult, Document, CollectionDriver, UpdateFilter, UpdateModel, Writer} from '../interfaces';

export class UpdateWriter<TSchema extends Document> extends Writer<TSchema, UpdateModel<TSchema>> {
  public constructor(
    driver: CollectionDriver<TSchema>,
    private single: boolean,
  ) { super(driver); }

  public async execute({filter, update}: UpdateModel<TSchema>) {
    const input = await this.driver.find(filter, this.single ? {limit: 1} : {}).toArray();
    let result: Partial<BulkWriteResult> = {
      matchedCount: input.length,
      modifiedCount: input.length, // TODO: Not necessarily true
    }
    const output = this.updateDocuments(input, update);
    await this.driver.write(new ChangeSet(output, input));

    for (const doc of output) {
      this.driver.emit('change', makeWriteChange('update', doc, this.driver.ns));
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