import {
  AggregationPipeline,
  CollectionFactory,
  MemoryCollection,
  Database
} from '@ziqquratu/database';

const equal = require('fast-deep-equal/es6');

/** Configuration for aggregation collection */
export interface AggregationCollectionConfig {
  /** The name of the collection to aggregate from */
  from: string;

  /** The aggregation pipeline */
  pipeline: AggregationPipeline;

  /**
   * Automatically update documents when changes are made to the collection
   * we are aggregating from.
   *
   * When sync is turned on this collection should strictly function as
   * read-only since a sync will remove any documents that have been manually
   * added.
   *
   * @default true
   */
  sync?: boolean;
}

export class AggregationCollectionFactory<T> extends CollectionFactory<T> {
  public constructor(private config: AggregationCollectionConfig) {
    super();
  }

  public async create(name: string, database: Database) {
    const foreign = await database.collection(this.config.from);
    const collection = new MemoryCollection<T>(name, database, {
      documents: await foreign.aggregate(this.config.pipeline).toArray()
    });

    const update = async () => {
      const docs = await foreign.aggregate<any>(this.config.pipeline).toArray();

      await collection.deleteMany({_id: {$nin: docs.map(d => d._id)}});

      for (const doc of docs) {
        const old = await collection.findOne({_id: doc._id});
        if (!old || !equal(doc, old)) {
          await collection.replaceOne({_id: doc._id}, doc, {upsert: true});
        }
      }
    }

    if (this.config.sync !== false) {
      foreign.on('change', () => update());
    }

    return collection;
  }
}

export const aggregation = (config: AggregationCollectionConfig) =>
  new AggregationCollectionFactory(config);
