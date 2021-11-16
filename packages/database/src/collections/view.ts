import {Factory} from '@tashmit/core';
import {withMiddleware} from '../middleware';
import {MemoryCollection, MemoryCollectionCursor} from './memory';
import {
  AggregationPipeline,
  Collection,
  CollectionFactory,
  Cursor,
  Database,
  Filter,
  QueryOptions,
  ViewCollectionConfig
} from '../interfaces';
import {readOnly} from '../middleware/mutation';
import {AbstractCursor} from '../cursor';
import {ChangeSet} from '../util';


class ViewCursor<T> extends AbstractCursor<T> {
  constructor(
    private getDocuments: Promise<T[]>,
    filter: Filter<any> = {},
    options: QueryOptions = {},
  ) {
    super(filter, options);
  }

  public async toArray(): Promise<T[]> {
    return this.createCursor().then(c => c.toArray());
  }

  public async count(applySkipLimit?: boolean): Promise<number> {
    return this.createCursor().then(c => c.count(applySkipLimit));
  }

  private async createCursor() {
    return new MemoryCollectionCursor(await this.getDocuments, this.filter, this.options);
  }
}


class ViewCollection<T> extends MemoryCollection<T> {
  private getDocuments: Promise<T[]>;

  public constructor(
    name: string,
    database: Database,
    protected viewOf: Collection<any>,
    protected pipeline: AggregationPipeline,
  ) {
    super(name, database);
    this.getDocuments = this.sync();
    viewOf.on('change', () => {
      this.getDocuments = this.sync()
    });
  }

  public async aggregate<U>(pipeline: AggregationPipeline): Promise<U[]> {
    await this.sync();
    return super.aggregate(pipeline);
  }

  public find(filter: Filter<T> = {}, options: QueryOptions<T> = {}): Cursor<T> {
    return new ViewCursor<T>(this.getDocuments, filter, options);
  }

  private async sync() {
    const result = await this.viewOf.aggregate<any>(this.pipeline);
    for (const change of ChangeSet.fromDiff(this.documents, result).toChanges(this)) {
      this.emit('change', change);
    }
    return this.documents = result;
  }
}

export function view<T = any>(config: ViewCollectionConfig): CollectionFactory<T> {
  return Factory.of(({name, database}) => {
    const collection = new ViewCollection<T>(
      name, database, database.collection(config.viewOf), config.pipeline
    );

    return withMiddleware(collection, [readOnly]);
  });
}
