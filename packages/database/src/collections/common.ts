import {Aggregator as MingoAggregator} from 'mingo/aggregator';
import { BulkWriteResult, DeleteModel, QueryOptions, WithId } from '..';
import {
  AggregationPipeline,
  AnyBulkWriteOperation,
  Document,
  Find,
  FindOne,
  InsertOneModel,
  OptionalId,
  ReplaceOneModel,
  UpdateModel,
  UpdateFilter,
} from '../interfaces';


export interface Writer<TModel> {
  execute(model: TModel): Promise<Partial<BulkWriteResult>>;
}

export interface CollectionDriver<TSchema extends Document> {
  insert(document: OptionalId<TSchema>): Promise<void>;

  delete(matched: TSchema[]): Promise<void>

  replace(old: TSchema, replacement: TSchema): Promise<void>

  findOne: FindOne<TSchema>;
  find: Find<TSchema>;
}

export class BulkWriteOperationFactory<TSchema extends Document> {
  public constructor(private writers: Record<string, Writer<AnyBulkWriteOperation<TSchema>>>) {}

  public static fromDriver<TSchema extends Document>(driver: CollectionDriver<TSchema>) {
    const insertOne = new InsertOneWriter(driver);
    const replaceOne = new ReplaceOneWriter(driver, insertOne);

    return new BulkWriteOperationFactory<TSchema>({
      'insertOne': insertOne,
      'replaceOne': replaceOne,
      'updateOne': new UpdateWriter(replaceOne, true),
      'updateMany': new UpdateWriter(replaceOne, false),
      'deleteOne': new DeleteWriter(driver, true),
      'deleteMany': new DeleteWriter(driver, false),
    } as any);
  }

  public createOperation(
    operations: AnyBulkWriteOperation<TSchema>[]
  ): BulkWriteOperation<TSchema> {
    return new BulkWriteOperation(operations, this.writers);
  }
}

export class BulkWriteOperation<TSchema extends Document> {
  public constructor(
    private operations: AnyBulkWriteOperation<TSchema>[],
    private writers: Record<string, Writer<AnyBulkWriteOperation<TSchema>>>,
  ) {}

  public async execute() {
    let r: BulkWriteResult = {
      insertedCount: 0,
      upsertedCount: 0,
      matchedCount: 0,
      modifiedCount: 0,
      deletedCount: 0,
      upsertedIds: {},
      insertedIds: {},
    };

    const handleOp = async (op: AnyBulkWriteOperation<TSchema>) => {
      const [name, data] = Object.entries(op)[0];
      return this.writers[name].execute(data);
    }

    for (const op of this.operations) {
      const opResult = await handleOp(op);
      if (opResult.insertedIds) {
        r.insertedIds[r.insertedCount] = opResult.insertedIds[0];
      }
      if (opResult.upsertedIds) {
        r.upsertedIds[r.upsertedCount] = opResult.upsertedIds[0];
      }
      r.insertedCount += opResult.insertedCount || 0;
      r.upsertedCount += opResult.upsertedCount || 0;
      r.matchedCount += opResult.matchedCount || 0;
      r.modifiedCount += opResult.modifiedCount || 0;
      r.deletedCount += opResult.deletedCount || 0;
    }
    return r;
  }
}

export class InsertOneWriter<TSchema extends Document> implements Writer<InsertOneModel<TSchema>> {
  public constructor(private driver: CollectionDriver<TSchema>) {}

  public async execute({document}: InsertOneModel<TSchema>): Promise<Partial<BulkWriteResult>> {
    await this.driver.insert(document);
    return {insertedCount: 1, insertedIds: [document._id]}
  }
}

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

export class DeleteWriter<TSchema> implements Writer<DeleteModel<TSchema>> {
  public constructor(
    public readonly driver: CollectionDriver<TSchema>,
    private single: boolean,
  ) {}

  public async execute({filter}: DeleteModel<TSchema>): Promise<Partial<BulkWriteResult>> {
    const matched = await this.driver.find(filter, {projection: {_id: 1}, limit: this.single ? 1 : undefined}).toArray();
    if (matched.length !== 0) {
      await this.driver.delete(matched as any);
    }
    return {deletedCount: matched.length};
  }
}

export class UpdateWriter<TSchema extends Document> implements Writer<UpdateModel<TSchema> | UpdateModel<TSchema>> {
  public constructor(
    protected replaceOne: ReplaceOneWriter<TSchema>,
    protected single: boolean,
  ) {}

  public async execute({filter, update, upsert}: UpdateModel<TSchema>): Promise<Partial<BulkWriteResult>> {
    const input = await this.driver.find(filter, this.single ? {limit: 1} : {}).toArray();
    let result: Partial<BulkWriteResult> = {
      matchedCount: input.length,
      modifiedCount: input.length, // TODO: Not necessarily true
    }
    for (const replacement of this.updateDocuments(input, update)) {
      await this.replaceOne.execute({
        filter: {_id: replacement._id},
        replacement,
        upsert
      });
    }
    return result;
  }

  protected updateDocuments(input: TSchema[], update: UpdateFilter<TSchema>): TSchema[] {
    const pipeline = Object.entries(update).reduce((acc, [k, v]) => {
      return acc.concat([{[k]: v}]);
    }, [] as AggregationPipeline);
    return new MingoAggregator(pipeline).run(input) as TSchema[];
  }

  protected get driver() { return this.replaceOne.driver }
}
