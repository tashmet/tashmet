import {
  CreateCollectionOptions,
  Document,
  PkFactory,
  TashmetProxy,
} from './interfaces.js';
import { Collection } from './collection.js';
import { CommandOperation } from './operations/command.js';
import { DropCollectionOperation, DropDatabaseOperation } from './operations/drop.js';
import { TashmetNamespace } from './utils.js';

/** @public */
export interface DatabaseOptions {
  /** Force server to assign _id values instead of driver. */
  forceServerObjectId?: boolean;
  /** A primary key factory object for generation of custom _id keys. */
  pkFactory?: PkFactory;
  /** Should retry failed writes */
  retryWrites?: boolean;
}

export interface Database {
  readonly databaseName: string;

  /**
   * Get an existing collection by name.
   *
   * @param name The name of the collection.
   * @returns The instance of the collection.
   */
  collection<TSchema extends Document = any>(name: string): Collection<TSchema>;

  createCollection<TSchema extends Document = any>(name: string, options?: CreateCollectionOptions): Collection<TSchema>;

  /**
   * Fetch all collections for the current db.
   */
  collections(): Collection[];

  /**
   * Drop a collection from the database, removing it permanently.
   *
   * @param name - Name of collection to drop
   */
  dropCollection(name: string): Promise<boolean>;

  command(command: Document): Promise<Document>;
}

export class Database implements Database {
  protected collMap: {[name: string]: Collection} = {};
  private ns: TashmetNamespace;

  public constructor(
    public readonly databaseName: string,
    private proxy: TashmetProxy,
    public readonly options: DatabaseOptions = {},
  ) {
    this.ns = new TashmetNamespace(databaseName);
  }

  public collection(name: string): Collection {
    if (name in this.collMap) {
      return this.collMap[name];
    }
    return this.createCollection(name);
  }

  public collections() {
    return Object.values(this.collMap);
  }

  public createCollection<T extends Document = any>(
    name: string, options: CreateCollectionOptions = {}): Collection<T>
  {
    try {
      if (name in this.collMap) {
        throw new Error(`a collection named '${name}' already exists in database`);
      }

      this.proxy.command(this.ns, {create: name, ...options});

      const c = new Collection<T>(name, this.proxy, this);
      this.collMap[name] = c;
      return c;
    } catch (err) {
      throw err;
    }
  }

  public async dropCollection(name: string): Promise<boolean> {
    return this.executeOperation(new DropCollectionOperation(this.ns.withCollection(name), {}));
  }

  public async dropDatabase(): Promise<boolean> {
    return this.executeOperation(new DropDatabaseOperation(this.ns, {})); 
  }

  public async command(command: Document): Promise<Document> {
    return this.proxy.command(this.ns, command);
  }

  private executeOperation<T>(operation: CommandOperation<T>): Promise<T> {
    return operation.execute(this.proxy) as Promise<T>;
  }
}
