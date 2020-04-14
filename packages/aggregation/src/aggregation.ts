import {
  AggregationPipeline,
  CollectionFactory,
  MemoryCollection,
  Database
} from '@ziqquratu/database';

const equal = require('fast-deep-equal/es6');

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
    const collection = new MemoryCollection<T>(name, database, {
      documents: await foreign.aggregate(this.config.pipeline)
    });

    const update = async () => {
      const docs = await foreign.aggregate(this.config.pipeline) as any[];

      await collection.deleteMany({_id: {$nin: docs.map(d => d._id)}});

      for (const doc of docs) {
        const old = await collection.findOne({_id: doc._id});
        if (!old || !equal(doc, old)) {
          await collection.replaceOne({_id: doc._id}, doc, {upsert: true});
        }
      }
    }
    foreign.on('document-upserted', () => update());
    foreign.on('document-removed', () => update());

    return collection;
  }
}
export const aggregation = (config: AggregationCollectionConfig) =>
  new AggregationCollectionFactory(config);
