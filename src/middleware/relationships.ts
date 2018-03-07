import {provider, Injector} from '@ziggurat/tiamat';
import {before, after, Middleware} from '@ziggurat/ningal';
import {map, orderBy, remove, transform} from 'lodash';
import {Collection, ClassType, Pipe, Step} from '../interfaces';
import {Controller} from '../database/controller';
import {Document} from '../models/document';

export interface RelationshipsConfig {
  setup: Function;

  key: string;
}

export const relationships = (config: RelationshipsConfig) => {
  return (injector: Injector, controller: Controller): Middleware  => {
    return new RelationshipsMiddleware(controller, config);
  };
};

export class ComparatorList {
  private comparators: {model: any, fn: Function}[] = [];

  public add<T>(model: ClassType<T>, fn: (o1: T, o2: T) => number) {
    this.comparators.push({model, fn});
  }

  public compare(d1: Document, d2: Document): number {
    for (let c of this.comparators) {
      if (d1 instanceof c.model && d2 instanceof c.model) {
        return c.fn(d1, d2);
      }
    }
    return 0;
  }
}

export class RelationshipsMiddleware extends Middleware {
  private comparators = new ComparatorList();

  public constructor(
    private controller: Controller,
    private config: RelationshipsConfig
  ) {
    super();
    config.setup(this.comparators);
  }

  @before({
    step: Step.Cache,
    pipe: Pipe.Populate
  })
  private async addRelationshipsOnPopulate(doc: Document): Promise<Document> {
    const related = await this.findRelated(doc, this.controller.buffer);
    this.setRefs(doc, map(related, o => o._id));
    return doc;
  }

  @after({
    step: Step.Validate,
    pipe: Pipe.Upsert
  })
  private async addRelationshipsOnUpsert(doc: Document): Promise<Document> {
    let related = await this.findRelated(doc, this.controller.cache);
    this.setRefs(doc, map(related, a => a._id));
    for (let other of related) {
      this.getRefs(doc).push(doc._id);
      await this.controller.cache.upsert(other);
    }
    return doc;
  }

  @after({
    step: Step.Uncache,
    pipe: Pipe.Remove
  })
  private async removeRelationships(doc: Document): Promise<Document> {
    for (let other of await this.controller.cache.find({[this.config.key]: doc._id})) {
      remove(this.getRefs(doc), id => id === doc._id);
      await this.controller.cache.upsert(other);
    }
    return doc;
  }

  private async findRelated(doc: Document, collection: Collection): Promise<Document[]> {
    let related: any[] = [];
    for (let other of await collection.find({_id: {$ne: doc._id}})) {
      const score = this.comparators.compare(doc, other);
      if (score > 0) {
        related.push({doc: other, score: score});
      }
    }
    return transform(orderBy(related, 'score', 'desc'), (list, value, key) => {
      list.push(value.doc);
    });
  }

  private setRefs(doc: Document, refs: string[]) {
    (<any>doc)[this.config.key] = refs;
  }

  private getRefs(doc: Document) {
    return (<any>doc)[this.config.key];
  }
}
