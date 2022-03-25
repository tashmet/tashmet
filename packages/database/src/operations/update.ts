import {makeWriteChange, ChangeSet} from '../changeSet';
import {BulkWriteResult, Document, Store, UpdateModel, Writer} from '../interfaces';

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
    const pipeline = Object.entries(update).reduce((acc, [k, v]) => {
      return acc.concat([{[k]: v}]);
    }, [] as Document[]);

    if (this.single) {
      pipeline.unshift({$limit: 1});
    }

    const output = await this.store.aggregate<TSchema>([
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
