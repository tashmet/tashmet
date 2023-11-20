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
import { AggregateOptions } from './operations/aggregate.js';
import { AggregationCursor } from './cursor/aggregationCursor.js';

/** @public */
export interface DatabaseOptions {
  /** Force server to assign _id values instead of driver. */
  forceServerObjectId?: boolean;
  /** A primary key factory object for generation of custom _id keys. */
  pkFactory?: PkFactory;
  /** Should retry failed writes */
  retryWrites?: boolean;
}

export class Database {
  private ns: TashmetNamespace;

  public constructor(
    public readonly databaseName: string,
    private proxy: TashmetProxy,
    public readonly options: DatabaseOptions = {},
  ) {
    this.ns = new TashmetNamespace(databaseName);
  }

  get namespace(): string {
    return this.ns.toString();
  }

  /**
   * Execute an aggregation framework pipeline against the database
   *
   * @param pipeline - An array of aggregation stages to be executed
   * @param options - Optional settings for the command
   */
  aggregate<T extends Document = Document>(
    pipeline: Document[] = [],
    options?: AggregateOptions
  ): AggregationCursor<T> {
    return new AggregationCursor(this.ns, this.proxy, pipeline, options);
  }

  /**
   * Returns a reference to a Tashmet Collection. If it does not exist it will be created implicitly.
   *
   * Collection namespace validation is performed server-side.
   *
   * @param name - the collection name we wish to access.
   * @returns return the new Collection instance
   */
  public collection<TSchema extends Document>(name: string): Collection<TSchema> {
    return new Collection<TSchema>(name, this.proxy, this);
  }

  /**
   * Create a new collection on a server with the specified options. Use this to create capped collections.
   *
   * Collection namespace validation is performed server-side.
   *
   * @param name - The name of the collection to create
   * @param options - Optional settings for the command
   */
  public async createCollection<TSchema extends Document = Document>(
    name: string, options: CreateCollectionOptions = {}): Promise<Collection<TSchema>>
  {
      await this.command({create: name, ...options});
      return new Collection<TSchema>(name, this.proxy, this);
  }

  /**
   * Drop a collection from the database, removing it permanently.
   *
   * @param name - Name of collection to drop
   */
  public async dropCollection(name: string): Promise<boolean> {
    return this.executeOperation(new DropCollectionOperation(this.ns.withCollection(name), {}));
  }

  /**
   * Drop a database, removing it permanently from the server.
   */
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
