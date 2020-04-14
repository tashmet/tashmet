import {
  AggregationPipeline,
  CollectionFactory,
  MemoryCollection,
  Database
} from '@ziqquratu/database';

export interface AggregationCollectionConfig {
  from: string;
  pipeline: AggregationPipeline;
}

export class AggregationCollectionFactory<T> extends CollectionFactory<T> {
  public constructor(private config: AggregationCollectionConfig) {
    super();
  }

  public async create(name: string, database: Database) {
    const foreign = await database.collection(this.config.from);

    return new MemoryCollection<T>(name, database, {
      documents: await foreign.aggregate(this.config.pipeline)
    });
  }
}
export const aggregation = (config: AggregationCollectionConfig) =>
  new AggregationCollectionFactory(config);
