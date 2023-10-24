import { provider } from "@tashmet/core";
import { ChangeStreamDocument, EventEmitter, TashmetCollectionNamespace } from "@tashmet/tashmet";
import { ReadWriteCollection, WriteError, WriteOptions } from "./interfaces";

@provider()
export class Store extends EventEmitter {
  private collections: Record<string, ReadWriteCollection> = {};

  public addCollection(collection: ReadWriteCollection) {
    this.collections[collection.ns.toString()] = collection;
  }

  public dropCollection(ns: TashmetCollectionNamespace) {
    delete this.collections[ns.toString()];
  }

  public getCollection(ns: TashmetCollectionNamespace) {
    if (ns.toString() in this.collections) {
      return this.collections[ns.toString()];
    } else {
      throw Error(`No collection for namespace: ${ns.toString()}`)
    }
  }

  public async write(changes: ChangeStreamDocument[], options: WriteOptions) {
    const namespaces = changes.reduce((acc, cs) => {
      acc.add(`${cs.ns.db}.${cs.ns.coll}`);
      return acc;
    }, new Set<string>)

    const writeErrors: WriteError[] = [];
    for (const key of namespaces.keys()) {
      const ns = TashmetCollectionNamespace.fromString(key);
      const coll = this.getCollection(ns);
      writeErrors.push(...await coll.write(changes.filter(cs => cs.ns.db === ns.db && cs.ns.coll === ns.collection), options));
    }

    return writeErrors;
  }
}
