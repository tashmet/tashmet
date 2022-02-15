import ObjectID from 'bson-objectid';
import {intersection} from 'mingo/util';
import {Document} from './interfaces';
import {Collection} from './collection';
import {ChangeStreamDocument } from '.';


export function idSet(collection: any[]) {
  return new Set(collection.map(doc => doc._id));
}

export const makeWriteChange = (operationType: 'insert' | 'update' | 'replace' | 'delete', fullDocument: Document, ns: {db: string, coll: string}) => ({
  _id: new ObjectID(),
  operationType,
  ns,
  documentKey: fullDocument._id,
  fullDocument,
});

export class ChangeSet<T extends Document> {
  public constructor(
    public readonly incoming: T[] = [],
    public readonly outgoing: T[] = [],
  ) {}

  /**
   * Generate a change-set by comparing two collections
   *
   * @param a Collection before changes
   * @param b Collection after changes
   * @returns A change-set
   */
  public static fromDiff<T extends Document>(a: T[], b: T[]): ChangeSet<T> {
    const unchangedIds = idSet(intersection(a, b));

    return new ChangeSet(
      b.filter(doc => !unchangedIds.has(doc._id)),
      a.filter(doc => !unchangedIds.has(doc._id)),
    );
  }

  public static fromInsert<T extends Document>(docs: T[]): ChangeSet<T> {
    return new ChangeSet(docs, []);
  }

  public static fromDelete<T extends Document>(docs: T[]): ChangeSet<T> {
    return new ChangeSet([], docs);
  }

  public static fromReplace<T extends Document>(old: T, replacement: T): ChangeSet<T> {
    return new ChangeSet([replacement], [old]);
  }

  public toChanges(ns: {db: string, coll: string}): ChangeStreamDocument[] {
    return [
      ...this.insertions.map(doc => makeWriteChange('insert', doc, ns)),
      ...this.deletions.map(doc => makeWriteChange('delete', doc, ns)),
      ...this.replacements.map(doc => makeWriteChange('replace', doc, ns)),
    ]
  }

  public toInverse(): ChangeSet<T> {
    return new ChangeSet(this.outgoing, this.incoming);
  }

  public get insertions(): T[] {
    const outIds = idSet(this.outgoing);
    return this.incoming.filter(doc => !outIds.has(doc._id));
  }

  public get deletions(): T[] {
    const incIds = idSet(this.incoming);
    return this.outgoing.filter(doc => !incIds.has(doc._id));
  }

  public get replacements(): T[] {
    const outIds = idSet(this.outgoing);
    return this.incoming.filter(doc => outIds.has(doc._id));
  }

  async applyTo(collection: Collection) {
    const inserted = this.insertions;
    const deleted = this.deletions;
    const replaced = this.replacements;

    if (inserted.length > 0) {
      await collection.insertMany(inserted);
    }
    if (deleted.length > 0) {
      await collection.deleteMany({_id: {$in: deleted.map(doc => doc._id)}});
    }
    for (const doc of replaced) {
      await collection.replaceOne({_id: doc._id}, doc);
    }
  }
}
