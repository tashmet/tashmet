import { CollationSpec } from 'mingo/core';
import { ChangeStreamDocument } from '../changeStream';
import { AggregationEngine } from '../aggregation';
import { Document } from '../interfaces';
import { InsertCommand } from './insert';
import { WriteCommand, makeWriteChange } from './write';
import { QueryEngine } from '../query';

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

export class QueryUpdateCommand extends UpdateCommand {
  public constructor(updates: Document[], ns: any, private engine: QueryEngine) {
    super(updates, ns);
  }

  protected async executeUpdate({ q, u, upsert, multi, collation }: Document, type: UpdateType): Promise<void> {
    if (type !== UpdateType.Replace) {
      throw Error('Only replace is supported with query update');
    }
    const output = await this.engine.find(this.ns.coll, {
      filter: q,
      limit: multi ? undefined : 1,
      collation
    }).toArray();

    if (output.length === 0 && upsert) {
      await this.upsert([u]);
    } else {
      this.update(output.map((doc: Document) => ({_id: doc._id, ...u})), type);
    }
  }
}

export class AggregationUpdateCommand extends UpdateCommand {
  public constructor(updates: Document[], ns: any, private engine: AggregationEngine) {
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
    let output = await this.aggregate([{$match: q || {}}, ...pipeline], this.ns.coll, collation);

    if (output.length === 0 && upsert) {
      await this.upsert(await this.aggregate(pipeline, this.genEmptyDoc(), collation));
    } else {
      this.update(output, type);
    }
  }

  private aggregate = (pipeline: Document[], coll: string | AsyncIterable<Document>, collation?: CollationSpec): Promise<Document[]> => {
    const c = this.engine.aggregate(coll, pipeline, collation);
    return c.toArray();
  }

  private async *genEmptyDoc() {
    yield {};
  }
}
