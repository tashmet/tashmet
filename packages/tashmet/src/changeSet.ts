import ObjectID from 'bson-objectid';
import {AnyBulkWriteOperation, Document, OptionalId} from './interfaces';
import {ChangeStreamDocument} from './changeStream';

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
    ];
  }

  public toOperations(): AnyBulkWriteOperation<T>[] {
    return [
      ...this.insertions.map(doc => ({insertOne: {document: doc as OptionalId<T>}})),
      ...this.deletions.map(doc => ({deleteOne: {filter: {_id: doc._id}}})),
      ...this.replacements.map(doc => ({replaceOne: {filter: {_id: doc._id}, replacement: doc}})),
    ];
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
}
