import {Store} from '@tashmet/database';
import {BufferStore} from './buffer';
import {Pipeline} from '../pipeline';

export type BundleOutput<T> = (source: Pipeline<T>) => Promise<void>;

export interface BundleStreamConfig<T> {
  /**
   * Input/Output stream
   */
  seed?: Pipeline<T>;

  input?: Pipeline<T>;

  output: BundleOutput<T>;
}

export class BundleStore<TSchema> extends BufferStore<TSchema> {
  public constructor(
    buffer: Store<TSchema>,
    public output: BundleOutput<TSchema>,
  ) {
    super(buffer);
  }

  public async persist() {
    return this.output(Pipeline.fromCursor(this.buffer.find()));
  }
}
