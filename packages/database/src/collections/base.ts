import {
  Collection,
  Document,
  Filter,
  InsertManyResult,
  UpdateResult,
  UpdateFilter,
} from '../interfaces';
import {updateOne, updateMany} from '../aggregation';


const makeUpdateResult = (init: Partial<UpdateResult> = {}): UpdateResult =>
  Object.assign({
    acknowledged: true,
    matchedCount: 0,
    modifiedCount: 0,
    upsertedCount: 0,
    upsertedId: undefined,
  }, init);


export abstract class AbstractCollection<T extends Document = any> extends Collection<T> {
  public async insertMany(docs: T[]): Promise<InsertManyResult> {
    let result: InsertManyResult = {
      insertedCount: 0,
      insertedIds: {},
      acknowledged: true
    };
    for (let i=0; i<docs.length; i++) {
      const resultOne = await this.insertOne(docs[i]);
      result.insertedCount += 1;
      result.insertedIds[i] = resultOne.insertedId;
    }
    return result;
  }

  public async updateOne(filter: Filter<T>, update: UpdateFilter<T>): Promise<UpdateResult> {
    const input = await this.findOne(filter);
    if (!input) {
      return makeUpdateResult();
    } else {
      return this.replaceOne({_id: input._id}, updateOne(input, update));
    }
  }

  public async updateMany(filter: Filter<T>, update: UpdateFilter<T>): Promise<UpdateResult> {
    const input = await this.find(filter).toArray();
    let result = makeUpdateResult({
      matchedCount: input.length,
      modifiedCount: input.length, // TODO: Not necessarily true
    })
    for (const doc of updateMany(input, update)) {
      await this.replaceOne({_id: doc._id}, doc);
    }
    return result;
  }

  protected async upsertOne(doc: T): Promise<Partial<UpdateResult>> {
    const {insertedId} = await this.insertOne(doc);
    Object.assign(doc, {_id: insertedId});
    return {upsertedId: insertedId, upsertedCount: 1};
  }
}
