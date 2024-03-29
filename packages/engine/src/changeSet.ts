import ObjectID from 'bson-objectid';
import { ChangeStreamDocument, Document } from '@tashmet/tashmet';

export function idSet(collection: any[]) {
  return new Set(collection.map(doc => JSON.stringify(doc._id)));
}

export const makeWriteChange = (operationType: 'insert' | 'update' | 'replace' | 'delete', fullDocument: Document, ns: {db: string, coll: string}) => ({
  _id: new ObjectID().toHexString(),
  operationType,
  ns,
  documentKey: {_id: fullDocument._id},
  fullDocument,
});

export class ChangeSet<T extends Document = Document> {
  constructor(
    public readonly incoming: T[] = [],
    public readonly outgoing: T[] = [],
  ) {}


  static fromInsert<T extends Document>(docs: T[]): ChangeSet<T> {
    return new ChangeSet(docs, []);
  }

  static fromDelete<T extends Document>(docs: T[]): ChangeSet<T> {
    return new ChangeSet([], docs);
  }

  static fromReplace<T extends Document>(old: T, replacement: T): ChangeSet<T> {
    return new ChangeSet([replacement], [old]);
  }

  toChanges(ns: {db: string, coll: string}): ChangeStreamDocument[] {
    return [
      ...this.insertions.map(doc => makeWriteChange('insert', doc, ns)),
      ...this.deletions.map(doc => makeWriteChange('delete', doc, ns)),
      ...this.replacements.map(doc => makeWriteChange('replace', doc, ns)),
    ];
  }

  /*
  public toOperations(): AnyBulkWriteOperation<T>[] {
    return [
      ...this.insertions.map(doc => ({insertOne: {document: doc as OptionalId<T>}})),
      ...this.deletions.map(doc => ({deleteOne: {filter: {_id: doc._id}}})),
      ...this.replacements.map(doc => ({replaceOne: {filter: {_id: doc._id}, replacement: doc}})),
    ];
  }
  */

  toInverse(): ChangeSet<T> {
    return new ChangeSet(this.outgoing, this.incoming);
  }

  get insertions(): T[] {
    const outIds = idSet(this.outgoing);
    return this.incoming.filter(doc => !outIds.has(JSON.stringify(doc._id)));
  }

  get deletions(): T[] {
    const incIds = idSet(this.incoming);
    return this.outgoing.filter(doc => !incIds.has(JSON.stringify(doc._id)));
  }

  get replacements(): T[] {
    const outIds = idSet(this.outgoing);
    return this.incoming.filter(doc => outIds.has(JSON.stringify(doc._id)));
  }
}
