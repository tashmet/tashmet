import {
  AbstractAggregator,
  AggregatorFactory,
  AggregationEngine,
  DatabaseEngine,
  Document,
  makeAggregateCommand,
  makeCountCommand,
  makeCreateCommand,
  makeDeleteCommand,
  makeDistinctCommand,
  makeFindCommand,
  makeGetMoreCommand,
  makeUpdateCommand,
  makeInsertCommand,
  StorageEngine,
  Streamable,
  makeDropCommand,
} from '@tashmet/engine';
import { MemoryStorageEngine } from './storageEngine';
import { BufferAggregator } from './aggregator';

export class MingoAggregatorFactory implements AggregatorFactory {
  public constructor(private collectionResolver: (collection: string) => Document[]) {}

  public createAggregator(pipeline: Document[], options: any): AbstractAggregator<Document> {
    return new BufferAggregator(pipeline, {collectionResolver: this.collectionResolver, ...options});
  }
}

export class MingoDatabaseEngine extends DatabaseEngine {
  public static inMemory(databaseName: string) {
    return MingoDatabaseEngine.fromMemory(new MemoryStorageEngine(databaseName));
  }

  public static fromMemory(storage: MemoryStorageEngine) {
    const aggFact = new MingoAggregatorFactory(coll => storage.resolve(coll));
    const aggregator = new AggregationEngine(storage, aggFact);
    return new MingoDatabaseEngine(storage, aggregator);
  }

  public constructor(
    store: StorageEngine & Streamable,
    aggregator: AggregationEngine,
  ) {
    super(store.databaseName, {
      $aggregate: makeAggregateCommand(aggregator),
      $count: makeCountCommand(aggregator),
      $create: makeCreateCommand(store, aggregator),
      $delete: makeDeleteCommand(store, aggregator),
      $distinct: makeDistinctCommand(aggregator),
      $drop: makeDropCommand(store),
      $find: makeFindCommand(aggregator),
      $getMore: makeGetMoreCommand(aggregator),
      $insert: makeInsertCommand(store),
      $update: makeUpdateCommand(store, aggregator.aggFact),
    });
  }
}
