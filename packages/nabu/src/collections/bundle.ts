/*
import {Store} from '@tashmet/tashmet';
import {BufferStore} from './buffer';
import {Pipeline} from '../pipeline';

export type BundleOutput<T> = (source: Pipeline<T>) => Promise<void>;

export interface BundleStreamConfig<T> {
  seed?: Pipeline<T>;

  input?: Pipeline<T>;

  output: (documents: Document[]) => Promise<void>;
}

export class BundleStore<TSchema> extends BufferStore<TSchema> {
  public constructor(
    buffer: Store<TSchema>,
    public output: (documents: Document[]) => Promise<void>,
  ) {
    super(buffer);
  }

  public async persist() {
    //console.log('persist');
    const findResult = await this.buffer.command({find: this.buffer.ns.coll, filter: {}});
    //console.log(findResult.cursor.firstBatch);
    return this.output(findResult.cursor.firstBatch);
  }
}
*/
