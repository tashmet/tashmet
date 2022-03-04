import {makeWriteChange, ChangeSet} from '../changeSet';
import {BulkWriteResult, CollectionDriver, Document, DeleteModel, FindOptions, Writer} from '../interfaces';

export class DeleteWriter<TSchema extends Document> extends Writer<TSchema, DeleteModel<TSchema>> {
  public constructor(
    driver: CollectionDriver<TSchema>,
    private single: boolean,
  ) { super(driver); }

  public async execute({filter}: DeleteModel<TSchema>): Promise<Partial<BulkWriteResult>> {
    const options: FindOptions = {
      //projection: {_id: 1},
      limit: this.single ? 1 : undefined,
    };
    const matched = await this.driver.find(filter, options).toArray();
    if (matched.length !== 0) {
      await this.driver.write(ChangeSet.fromDelete(matched));

      for (const document of matched) {
        this.driver.emit('change', makeWriteChange('delete', document, this.driver.ns));
      }
    }
    return {deletedCount: matched.length};
  }
}
