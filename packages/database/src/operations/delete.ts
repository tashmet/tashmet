import {BulkWriteResult, CollectionDriver, DeleteModel, QueryOptions, Writer} from '../interfaces';

export class DeleteWriter<TSchema> implements Writer<DeleteModel<TSchema>> {
  public constructor(
    public readonly driver: CollectionDriver<TSchema>,
    private single: boolean,
  ) {}

  public async execute({filter}: DeleteModel<TSchema>): Promise<Partial<BulkWriteResult>> {
    const options: QueryOptions = {
      projection: {_id: 1},
      limit: this.single ? 1 : undefined,
    };
    const matched = await this.driver.find(filter, options).toArray();
    if (matched.length !== 0) {
      await this.driver.delete(matched as any);
    }
    return {deletedCount: matched.length};
  }
}