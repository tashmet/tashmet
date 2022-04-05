import {
  Store,
  ChangeSet,
  FindOptions,
  Cursor,
  Filter,
} from '@tashmet/tashmet';
import {Pipeline} from '../pipeline';

/**
 * An abstract store where all read operations are directed to a given buffer.
 */
export abstract class BufferStore<TSchema> extends Store<TSchema> {
  public constructor(
    public buffer: Store<TSchema>,
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

  public find(filter?: Filter<TSchema>, options?: FindOptions): Cursor<TSchema> {
    return this.buffer.find(filter, options);
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
