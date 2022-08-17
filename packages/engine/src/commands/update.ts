import { CollationSpec } from 'mingo/core';
import { ChangeStreamDocument } from '../changeStream';
import { AggregatorFactory, DatabaseEngine, Document, StorageEngine, Streamable } from '../interfaces';
import { AbstractQueryEngine } from '../query';
import { InsertCommand } from './insert';
import { WriteCommand, makeWriteChange } from './write';

export enum UpdateType {
  Regular,
  Pipeline,
  Replace,
}

export function updateType(u: any) {
  if (Array.isArray(u)) {
    return UpdateType.Pipeline;
  } else if (Object.keys(u)[0].charAt(0) === '$') {
    return UpdateType.Regular;
  } else {
    return UpdateType.Replace;
  }
}

export function makeUpdateAggregationCommand(store: StorageEngine & Streamable, aggFact: AggregatorFactory) { 
  return ({update: coll, updates, ordered}: Document, db: DatabaseEngine) =>
    new AggregationUpdateCommand(updates, {db: db.databaseName, coll}, store, aggFact).write(store, db, ordered);
}

export function makeUpdateQueryCommand(store: StorageEngine, query: AbstractQueryEngine) {
  return ({update: coll, updates, ordered}: Document, db: DatabaseEngine) =>
    new QueryUpdateCommand(updates, {db: db.databaseName, coll}, query).write(store, db, ordered);
}

abstract class UpdateCommand extends WriteCommand {
  private changes: ChangeStreamDocument[] = [];

  public constructor(private updates: Document[], ns: {db: string, coll: string}) {
    super('update', ns);
  }

  public async execute(): Promise<ChangeStreamDocument[]> {
    for (const update of this.updates) {
      await this.executeUpdate(update, updateType(update.u));
    }
    return this.changes;
  }

  protected abstract executeUpdate({q, u, upsert, multi, collation}: Document, type: UpdateType): Promise<void>;

  protected async upsert(docs: Document[]) {
    this.changes.push(...await new InsertCommand(docs, this.ns).execute());
  }

  protected update(docs: Document[], type: UpdateType) {
    this.changes.push(...docs.map(doc =>
      makeWriteChange(type == UpdateType.Replace ? 'replace' : 'update', doc, this.ns)
    ));
  }
}

class QueryUpdateCommand extends UpdateCommand {
  public constructor(updates: Document[], ns: any, private query: AbstractQueryEngine) {
    super(updates, ns);
  }

  protected async executeUpdate({ q, u, upsert, multi, collation }: Document, type: UpdateType): Promise<void> {
    if (type !== UpdateType.Replace) {
      throw Error('Only replace is supported with query update');
    }
    const docs = await this.query.find(this.ns.coll, {filter: q, limit: multi ? undefined : 1}, collation).toArray();

    if (docs.length === 0 && upsert) {
      await this.upsert([u]);
    } else {
      this.update(docs.map(doc => ({_id: doc._id, ...u})), type);
    }
  }
}

class AggregationUpdateCommand extends UpdateCommand {
  public constructor(updates: Document[], ns: any, private store: Streamable, private aggFact: AggregatorFactory) {
    super(updates, ns);
  }

  protected async executeUpdate({ q, u, upsert, multi, collation }: Document, type: UpdateType): Promise<void> {
    let pipeline: Document[] = [];

    switch (type) {
      case UpdateType.Pipeline:
        pipeline = u;
        break;
      case UpdateType.Regular:
        pipeline = Object.entries(u).reduce<Document[]>((acc, [k, v]) => acc.concat([{[k]: v}]), []);
        break;
      case UpdateType.Replace:
        pipeline = [
          {$project: {'_id': 1}},
          {$set: u}
        ];
        break;
    }

    if (multi !== true) {
      pipeline.unshift({$limit: 1});
    }
    let output = await this.aggregate([{$match: q || {}}, ...pipeline], this.store.stream(this.ns.coll), collation);

    if (output.length === 0 && upsert) {
      await this.upsert(await this.aggregate(pipeline, this.genEmptyDoc(), collation));
    } else {
      this.update(output, type);
    }
  }

  private aggregate = (pipeline: Document[], stream: AsyncIterable<Document>, collation?: CollationSpec): Promise<Document[]> => {
    return this.aggFact.createAggregator(pipeline, {collation}).run(stream);
  }

  private async *genEmptyDoc() {
    yield {};
  }
}
