import {
  CreateCollectionOptions,
  Database,
  DatabaseFactory,
  Dispatcher,
  Document,
  Namespace,
} from './interfaces';
import { Collection } from './collection';
import { Logger, provider } from '@tashmet/core';
import { CommandOperation } from './operations/command';
import { DropCollectionOperation } from './operations/drop';


export class DatabaseService implements Database {
  protected collMap: {[name: string]: Collection} = {};

  public constructor(
    public readonly databaseName: string,
    private logger: Logger,
    private dispatcher: Dispatcher,
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

      this.dispatcher.dispatch(ns, {create: name, ...options});

      const c = new Collection<T>(name, this.dispatcher, this);
      this.collMap[name] = c;

      this.logger.inScope('createCollection').info(c.toString());
      return c;
    } catch (err) {
      this.logger.error(err.message);
      throw err;
    }
  }

  public async dropCollection(name: string): Promise<boolean> {
    return this.executeOperation(new DropCollectionOperation({db: this.databaseName, coll: name}, {}));
  }

  private executeOperation<T>(operation: CommandOperation<T>): Promise<T> {
    return operation.execute(this.dispatcher) as Promise<T>;
  }
}

@provider({
  key: DefaultDatabaseFactory,
  inject: [
    Logger,
    Dispatcher,
  ]
})
export class DefaultDatabaseFactory implements DatabaseFactory {
  public constructor(
    private logger: Logger,
    private dispatcher: Dispatcher,
  ) {}

  createDatabase(name: string): Database {
    return new DatabaseService(name, this.logger, this.dispatcher);
  }
}
