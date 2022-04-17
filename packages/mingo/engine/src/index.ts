import { MemoryStorageEngine, MingoCursorRegistry } from './storageEngine';
import { AggregateCommandHandler } from './commands/aggregate';
import { CountCommandHandler } from './commands/count';
import { DeleteCommandHandler } from './commands/delete';
import { DistinctCommandHandler } from './commands/distinct';
import { FindCommandHandler } from './commands/find';
import { InsertCommandHandler } from './commands/insert';
import { DatabaseEngine, MingoConfig, StorageEngine } from './interfaces';

export class MingoDatabaseEngine extends DatabaseEngine {
  public static inMemory(databaseName: string, config: Partial<MingoConfig> = {}) {
    const cursors = new MingoCursorRegistry();
    return new MingoDatabaseEngine(new MemoryStorageEngine(databaseName), cursors, config);
  }

  public constructor(store: StorageEngine, cursors: MingoCursorRegistry, options: MingoConfig) {
    super({
      'find': new FindCommandHandler(cursors, store, options),
      'insert': new InsertCommandHandler(store, options),
      'delete': new DeleteCommandHandler(store, options),
      'count': new CountCommandHandler(cursors, store, options),
      'aggregate': new AggregateCommandHandler(cursors, store, options),
      'distinct': new DistinctCommandHandler(store, options),
    });
  }
}
