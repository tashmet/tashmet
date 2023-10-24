/** @public */
export class TashmetNamespace {
  /**
   * Create a namespace object
   *
   * @param db - database name
   * @param collection - collection name
   */
  constructor(public db: string, public collection?: string) {
    this.collection = collection === '' ? undefined : collection;
  }

  toString(): string {
    return this.collection ? `${this.db}.${this.collection}` : this.db;
  }

  withCollection(collection: string): TashmetCollectionNamespace {
    return new TashmetCollectionNamespace(this.db, collection);
  }

  static fromString(namespace?: string): TashmetNamespace {
    if (typeof namespace !== 'string' || namespace === '') {
      throw new Error(`Cannot parse namespace from "${namespace}"`);
    }

    const [db, ...collectionParts] = namespace.split('.');
    const collection = collectionParts.join('.');
    return new TashmetNamespace(db, collection === '' ? undefined : collection);
  }
}

/**
 * @public
 *
 * A class representing a collection's namespace.  This class enforces (through Typescript) that
 * the `collection` portion of the namespace is defined and should only be
 * used in scenarios where this can be guaranteed.
 */
export class TashmetCollectionNamespace extends TashmetNamespace {
  constructor(db: string, override collection: string) {
    super(db, collection);
  }

  static override fromString(namespace?: string): TashmetCollectionNamespace {
    return super.fromString(namespace) as TashmetCollectionNamespace;
  }
}
