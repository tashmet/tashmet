import { TashmetCollectionNamespace } from '@tashmet/tashmet';
import { ChangeSet, Store, QueryPlan } from '@tashmet/engine';
import { Document } from '@tashmet/tashmet';
import { cloneDeep } from 'mingo/util';
import { toArray } from './util';

export class CollectionBuffer {
  private buffers: Record<string, Document[]> = {};
  private outNs: TashmetCollectionNamespace | undefined;
  private outInit: Document[] = [];

  constructor(
    private store: Store,
    private plan: QueryPlan | undefined,
  ) {
    this.outNs = plan?.merge || plan?.out;
  }

  async load() {
    for (const ns of this.plan?.foreignCollections || []) {
      this.buffers[ns.toString()] = await toArray(this.store.getCollection(ns).read({}));
    }
    if (this.outNs) {
      this.outInit = cloneDeep(this.buffers[this.outNs.toString()]) as Document[];
    }
  }

  get(ns: TashmetCollectionNamespace): Document[] {
    return this.buffers[ns.toString()];
  }

  async write() {
    if (this.outNs) {
      const cs = new ChangeSet(this.get(this.outNs), this.outInit);
      await this.store.write(cs.toChanges({db: this.outNs.db, coll: this.outNs.collection}), {ordered: true});
    }
  }
}
