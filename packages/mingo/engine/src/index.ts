import {
  AbstractAggregator,
  AggregatorFactory,
  AggregationEngine,
  Document,
  makeAggregateCommand,
  makeCountCommand,
  makeCreateCommand,
  makeDeleteCommand,
  makeDistinctCommand,
  makeDropCommand,
  makeFindCommand,
  makeGetMoreCommand,
  makeUpdateCommand,
  makeInsertCommand,
  StorageEngine,
  Streamable,
  ValidatorFactory,
  AbstractDatabaseEngine,
} from '@tashmet/engine';
import { MemoryStorageEngine } from './storageEngine';
import { BufferAggregator } from './aggregator';
import { Query } from 'mingo/query';

export { MemoryStorageEngine };

export class MingoAggregatorFactory implements AggregatorFactory {
  public constructor(private collectionResolver: (collection: string) => Document[]) {}

  public createAggregator(pipeline: Document[], options: any): AbstractAggregator<Document> {
    return new BufferAggregator(pipeline, {collectionResolver: this.collectionResolver, ...options});
  }
}

export class FilterValidatorFactory extends ValidatorFactory {
  public createValidator(rules: Document) {
    const query = new Query(rules as any);

    return (doc: any) => {
      if (query.test(doc)) {
        return doc;
      } else {
        throw new Error('Document failed validation');
      }
    }
  }
}

export class MingoDatabaseEngine extends AbstractDatabaseEngine {
  public static inMemory(databaseName: string) {
    return MingoDatabaseEngine.fromMemory(new MemoryStorageEngine(databaseName, {}, new FilterValidatorFactory()));
  }

  public static fromMemory(storage: MemoryStorageEngine) {
    const aggFact = new MingoAggregatorFactory(coll => storage.resolve(coll));
    const aggregator = new AggregationEngine(storage, aggFact);
    return new MingoDatabaseEngine(storage, aggregator);
  }

  public constructor(
    public readonly store: StorageEngine & Streamable,
    public readonly aggregator: AggregationEngine,
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
