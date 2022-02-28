import {
  Document,
  CollectionDriver,
  ChangeSet,
  QueryOptions,
  Cursor,
  Filter,
} from '@tashmit/database';
import {Pipeline} from '../pipeline';

/**
 * An abstract collection driver where all read operations are directed to a given buffer.
 */
export abstract class BufferDriver<TSchema> extends CollectionDriver<TSchema> {
  public constructor(
    public buffer: CollectionDriver<TSchema>,
  ) { super(buffer.ns); }

  public async write(cs: ChangeSet<TSchema>) {
    await this.buffer.write(cs);
    try {
      await this.persist(cs);
    } catch (err) {
      await this.buffer.write(cs.toInverse());
      throw err;
    }
  }

  protected abstract persist(cs: ChangeSet<TSchema>): Promise<void>;

  public find(filter?: Filter<TSchema>, options?: QueryOptions): Cursor<TSchema> {
    return this.buffer.find(filter, options);
  }

  public findOne(filter: Filter<TSchema>): Promise<TSchema | null> {
    return this.buffer.findOne(filter);
  }

  public aggregate<T>(pipeline: Document[]): Promise<T[]> {
    return this.buffer.aggregate(pipeline);
  }

  public async populate(seed: Pipeline<TSchema> | undefined) {
    if (seed) {
      return this.load(ChangeSet.fromInsert(await seed.toArray()));
    }
  }

  public async load(cs: ChangeSet<TSchema>) {
    await this.buffer.write(cs);
    this.emitAll(cs);
  }
}
