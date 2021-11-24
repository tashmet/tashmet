import {BulkWriteResult, CollectionDriver, Document, InsertOneModel, OptionalId, ReplaceOneModel, Writer} from '../interfaces';

export class ReplaceOneWriter<TSchema extends Document> implements Writer<ReplaceOneModel<TSchema>> {
  public constructor(
    public readonly driver: CollectionDriver<TSchema>,
    private insertOne: Writer<InsertOneModel<TSchema>>,
  ) {}

  public async execute({filter, replacement, upsert}: ReplaceOneModel<TSchema>): Promise<Partial<BulkWriteResult>> {
    let result: Partial<BulkWriteResult> = {
      matchedCount: await this.driver.find(filter).count(),
    };

    if (result.matchedCount && result.matchedCount > 0) {
      const old = await this.driver.findOne(filter);
      if (old) {
        await this.driver.replace(old, replacement);
      }
      return {...result, modifiedCount: 1};
    } else if (upsert) {
      return Object.assign({...result, ...await this.upsertOne(replacement as any)});
    }
    return result;
  }

  protected async upsertOne(document: OptionalId<TSchema>): Promise<Partial<BulkWriteResult>> {
    const {insertedIds} = await this.insertOne.execute({document});
    return {upsertedIds: insertedIds, upsertedCount: 1};
  }
}
