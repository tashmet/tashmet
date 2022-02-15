import {makeWriteChange, ChangeSet} from '../changeSet';
import {Document, InsertOneModel, Writer} from '../interfaces';

export class InsertOneWriter<TSchema extends Document> extends Writer<TSchema, InsertOneModel<TSchema>> {
  public async execute({document}: InsertOneModel<TSchema>) {
    await this.driver.write(ChangeSet.fromInsert([document as TSchema]));
    this.driver.emit('change', makeWriteChange('insert', document, this.driver.ns));

    return {insertedCount: 1, insertedIds: [document._id]}
  }
}
