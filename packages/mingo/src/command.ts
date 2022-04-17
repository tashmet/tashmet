import {Document} from '@tashmet/tashmet';
import {Options as MingoOptions} from 'mingo/core';
import { Iterator } from 'mingo/lazy';


export class MingoDatabaseStore {
  public constructor(
    public readonly name: string,
    public collections: {[coll: string]: Document[]} = {},
    public cursors: Record<string, Iterator> = {},
  ) {}

  public createCollection(name: string) {
    this.collections[name] = [];
  }

  public indexOf(coll: string, document: Document) {
    return this.collections[coll].findIndex(o => o._id === document._id);
  }
}

export class MingoCommandHandler {
  public constructor(protected store: MingoDatabaseStore, protected options: MingoOptions) {}
}
