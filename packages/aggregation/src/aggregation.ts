import {Factory} from '@tashmit/core';
import {AggregationPipeline, CollectionFactory, MemoryCollection} from '@tashmit/database';

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

export function aggregation<T = any>(config: AggregationCollectionConfig): CollectionFactory<T> {
  return Factory.of(async ({name, database}) => {
    const foreign = await database.collection(config.from);
    const collection = MemoryCollection.fromConfig<T>(name, database, {
      documents: await foreign.aggregate(config.pipeline)
    });

    const update = async () => {
      const docs = await foreign.aggregate<any>(config.pipeline);

      await collection.deleteMany({_id: {$nin: docs.map(d => d._id)}});

      for (const doc of docs) {
        const old = await collection.findOne({_id: doc._id});
        if (!old || !equal(doc, old)) {
          await collection.replaceOne({_id: doc._id}, doc, {upsert: true});
        }
      }
    }

    if (config.sync !== false) {
      foreign.on('change', () => update());
    }

    return collection;
  });
}
