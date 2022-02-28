import {CollectionDriver} from '@tashmit/database';
import {BufferDriver} from './buffer';
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

export class BundleDriver<TSchema> extends BufferDriver<TSchema> {
  public constructor(
    buffer: CollectionDriver<TSchema>,
    public output: BundleOutput<TSchema>,
  ) {
    super(buffer);
  }

  public async persist() {
    return this.output(Pipeline.fromCursor(this.buffer.find()));
  }
}
