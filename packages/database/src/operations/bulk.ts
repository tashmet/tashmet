import {
  AnyBulkWriteOperation,
  BulkWriteResult,
  CollectionDriver,
  Document,
  Writer,
} from '../interfaces';
import {ChangeStream, ChangeStreamDocument} from '../changeStream';
import {DeleteWriter} from './delete';
import {InsertOneWriter} from './insert';
import {ReplaceOneWriter} from './replace';
import {UpdateWriter} from './update';

export class BulkWriteOperationFactory<TSchema extends Document> {
  public constructor(private writers: Record<string, Writer<TSchema, any>>) {}

  public static fromDriver<TSchema extends Document>(driver: CollectionDriver<TSchema>) {
    return new BulkWriteOperationFactory<TSchema>({
      insertOne: new InsertOneWriter(driver),
      replaceOne: new ReplaceOneWriter(driver),
      updateOne: new UpdateWriter(driver, true),
      updateMany: new UpdateWriter(driver, false),
      deleteOne: new DeleteWriter(driver, true),
      deleteMany: new DeleteWriter(driver, false),
    });
  }

  public createOperation(
    operations: AnyBulkWriteOperation<TSchema>[],
    changeStreams: ChangeStream[] = [],
  ): BulkWriteOperation<TSchema> {
    return new BulkWriteOperation(operations, this.writers, changeStreams);
  }
}

export class BulkWriteOperation<TSchema extends Document> {
  public constructor(
    private operations: AnyBulkWriteOperation<TSchema>[],
    private writers: Record<string, Writer<TSchema, any>>,
    private changeStreams: ChangeStream[] = [],
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

    const changes: ChangeStreamDocument[] = [];

    const handleOp = async (op: AnyBulkWriteOperation<TSchema>) => {
      const [name, data] = Object.entries(op)[0];
      return this.writers[name].execute(data, change => {
        changes.push(change);
      });
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

    for (const changeStream of this.changeStreams) {
      for (const change of changes) {
        changeStream.emit('change', change);
      }
    }

    return r;
  }
}