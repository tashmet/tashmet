import {BulkWriteResult, CollectionDriver, Document, InsertOneModel, Writer} from '../interfaces';


export class InsertOneWriter<TSchema extends Document> implements Writer<InsertOneModel<TSchema>> {
  public constructor(private driver: CollectionDriver<TSchema>) {}

  public async execute({document}: InsertOneModel<TSchema>): Promise<Partial<BulkWriteResult>> {
    await this.driver.insert(document);
    return {insertedCount: 1, insertedIds: [document._id]}
  }
}
