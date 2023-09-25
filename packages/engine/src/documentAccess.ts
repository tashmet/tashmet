import { ChangeStreamDocument, Namespace } from "@tashmet/bridge";
import { CollectionRegistry, Document, Streamable, StreamOptions, Writable, WriteOptions } from "./interfaces";

export class DocumentAccess {
  private readables: Map<string, Streamable> = new Map();
  private writables: Map<string, Writable> = new Map();
  private registry: Map<string, CollectionRegistry> = new Map();

  public constructor() {
  }

  public stream(ns: Namespace, options: StreamOptions): AsyncIterable<Document> {
    const readable = this.readables.get(ns.db);

    if (!readable) {
      throw Error(`no readable registed for database: ${ns.db}`);
    }
    return readable.stream(ns.coll, options);
  }

  // TODO: Handle changes in multiple databases.
  public write(documents: ChangeStreamDocument[], options: WriteOptions) {
    if (documents.length === 0) {
      return [];
    }

    const db = documents[0].ns.db;
    const writable = this.writables.get(db);

    if (!writable) {
      throw Error(`no writable registed for database: ${db}`);
    }

    return writable.write(documents, options);
  }

  public create(ns: Namespace, options: Document): Promise<void> {
    const reg = this.registry.get(ns.db);

    if (!reg) {
      throw Error(`no database registed for: ${ns.db}`);
    }
    return reg.create(ns.coll, options);

  }

  public drop(ns: Namespace): Promise<void> {
    const reg = this.registry.get(ns.db);

    if (!reg) {
      throw Error(`no database registed for: ${ns.db}`);
    }
    return reg.drop(ns.coll);
  }

  public addStreamable(db: string, streamable: Streamable) {
    this.readables.set(db, streamable);
  }

  public addWritable(db: string, writable: Writable) {
    this.writables.set(db, writable);
  }

  public addRegistry(db: string, registry: CollectionRegistry) {
    this.registry.set(db, registry);
  }
}
