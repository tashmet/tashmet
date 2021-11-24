import {intersection} from 'mingo/util';
import {DatabaseChange, Document} from './interfaces';
import {Collection} from './collection';


export function idSet(collection: any[]) {
  return new Set(collection.map(doc => doc._id));
}

export class ChangeSet<T extends Document> {
  public constructor(
    public readonly incoming: T[],
    public readonly outgoing: T[],
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

  toChanges(collection: Collection<T>): DatabaseChange<T>[] {
    const incIds = idSet(this.incoming);
    const outIds = idSet(this.outgoing);
    const inserted = this.incoming.filter(doc => !outIds.has(doc._id));
    const deleted = this.outgoing.filter(doc => !incIds.has(doc._id));
    const replaced = this.outgoing.filter(doc => incIds.has(doc._id));

    const change = (action: 'insert' | 'delete' | 'replace', data: any[]) => ({
      action, data, collection,
    });

    let changes: DatabaseChange[] = [];
    if (inserted.length > 0) {
      changes.push(change('insert', inserted));
    }
    if (deleted.length > 0) {
      changes.push(change('delete', deleted));
    }
    if (replaced.length > 0) {
      for (const doc of replaced) {
        changes.push(change('replace', [doc, this.incoming.find(d => d._id === doc._id)]));
      }
    }
    return changes;
  }

  async applyTo(collection: Collection) {
    for (const {action, data} of this.toChanges(collection)) {
      switch (action) {
        case 'insert':
          await collection.insertMany(data);
          break;
        case 'delete':
          await collection.deleteMany({_id: {$in: data.map(doc => doc._id)}});
          break;
        case 'replace':
          await collection.replaceOne({_id: data[0]._id}, data[1]);
          break;
      }
    }
  }
}
