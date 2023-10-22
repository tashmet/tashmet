import {
  CreateCollectionOptions,
  Document,
  Namespace,
  TashmetProxy,
} from './interfaces.js';
import { Collection } from './collection.js';
import { CommandOperation } from './operations/command.js';
import { DropCollectionOperation, DropDatabaseOperation } from './operations/drop.js';

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

  public constructor(
    public readonly databaseName: string,
    private proxy: TashmetProxy,
  ) {}

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
      const ns: Namespace = {db: this.databaseName, coll: name};

      this.proxy.command(ns, {create: name, ...options});

      const c = new Collection<T>(name, this.proxy, this);
      this.collMap[name] = c;
      return c;
    } catch (err) {
      throw err;
    }
  }

  public async dropCollection(name: string): Promise<boolean> {
    return this.executeOperation(new DropCollectionOperation({db: this.databaseName, coll: name}, {}));
  }

  public async dropDatabase(): Promise<boolean> {
    return this.executeOperation(new DropDatabaseOperation({db: this.databaseName, coll: ''}, {})); 
  }

  public async command(command: Document): Promise<Document> {
    return this.proxy.command({ db: this.databaseName, coll: ''}, command);
  }

  private executeOperation<T>(operation: CommandOperation<T>): Promise<T> {
    return operation.execute(this.proxy) as Promise<T>;
  }
}
