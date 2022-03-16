import {Aggregator as MingoAggregator} from 'mingo/aggregator';
import {makeWriteChange, ChangeSet} from '../changeSet';
import {BulkWriteResult, Document, Store, UpdateFilter, UpdateModel, Writer} from '../interfaces';

export class UpdateWriter<TSchema extends Document> extends Writer<TSchema, UpdateModel<TSchema>> {
  public constructor(
    store: Store<TSchema>,
    private single: boolean,
  ) { super(store); }

  public async execute({filter, update}: UpdateModel<TSchema>) {
    const input = await this.store.find(filter, this.single ? {limit: 1} : {}).toArray();
    let result: Partial<BulkWriteResult> = {
      matchedCount: input.length,
      modifiedCount: input.length, // TODO: Not necessarily true
    }
    const output = this.updateDocuments(input, update);
    await this.store.write(new ChangeSet(output, input));

    for (const doc of output) {
      this.store.emit('change', makeWriteChange('update', doc, this.store.ns));
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