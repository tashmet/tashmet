import {makeWriteChange, ChangeSet} from '../changeSet';
import {Aggregator, BulkWriteResult, Document, Store, UpdateModel, Writer} from '../interfaces';

export class UpdateWriter<TSchema extends Document> extends Writer<TSchema, UpdateModel<TSchema>> {
  public constructor(
    store: Store<TSchema>,
    private single: boolean,
    private aggregator: Aggregator | undefined,
  ) { super(store); }

  public async execute({filter, update, collation}: UpdateModel<TSchema>) {
    const aggregator = this.aggregator;

    if (!aggregator) {
      throw new Error('No Aggregator registered with the container');
    }

    const input = await this.store.find(filter, this.single ? {limit: 1, collation} : {collation}).toArray();
    let result: Partial<BulkWriteResult> = {
      matchedCount: input.length,
      modifiedCount: input.length, // TODO: Not necessarily true
    }
    const pipeline = Object.entries(update).reduce((acc, [k, v]) => {
      return acc.concat([{[k]: v}]);
    }, [] as Document[]);

    if (this.single) {
      pipeline.unshift({$limit: 1});
    }

    const output = await aggregator.execute<TSchema>(this.store.ns, [
      {$match: filter},
      ...pipeline,
    ]).toArray();

    await this.store.write(new ChangeSet(output, input));

    for (const doc of output) {
      this.store.emit('change', makeWriteChange('update', doc, this.store.ns));
    }

    return result;
  }
}
