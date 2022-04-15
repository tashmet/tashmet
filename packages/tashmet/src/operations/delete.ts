import {makeWriteChange, ChangeSet} from '../changeSet';
import {BulkWriteResult, Store, Document, DeleteModel, FindOptions, Writer} from '../interfaces';

export class DeleteWriter<TSchema extends Document> extends Writer<TSchema, DeleteModel<TSchema>> {
  public constructor(
    store: Store<TSchema>,
    private single: boolean,
  ) { super(store); }

  public async execute({filter, collation}: DeleteModel<TSchema>): Promise<Partial<BulkWriteResult>> {
    const options: FindOptions = {
      //projection: {_id: 1},
      limit: this.single ? 1 : undefined,
      collation,
    };
    const findResult = await this.store.command({find: this.store.ns.coll, filter,...options});
    const matched = findResult.cursor.firstBatch;
    if (matched.length !== 0) {
      await this.store.write(ChangeSet.fromDelete(matched));

      for (const document of matched) {
        this.store.emit('change', makeWriteChange('delete', document, this.store.ns));
      }
    }
    return {deletedCount: matched.length};
  }
}
