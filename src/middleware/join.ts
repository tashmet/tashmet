import {Injector, ServiceIdentifier} from '@ziggurat/tiamat';
import {after, before, Middleware} from '@ziggurat/ningal';
import {Collection, Pipe, Step} from '../interfaces';
import {Controller} from '../database/controller';
import {Document} from '../models/document';
import {isString} from 'lodash';

/**
 * Configuration options for join middleware.
 */
export interface JoinConfig {
  /** The key in local documents that contain the id */
  key: string;

  /** The foreign collection */
  foreign: ServiceIdentifier<Controller>;
}

/**
 * Join documents from another collection to a key in documents in this one.
 *
 * The given key should exist on documents in this collection and have as its value an id of a
 * document in another collection. This middleware will then replace the id string with a
 * reference to the actual document if found.
 *
 * The join is performed on calls to find(), findOne() and upsert(). When the document is
 * persisted the join is reverted again.
 *
 * @param config The configuration options.
 */
export const join = (config: JoinConfig) => {
  return (injector: Injector, controller: Controller): Middleware  => {
    let foreign = injector.get<Collection>(config.foreign);
    return new JoinMiddleware(config, foreign);
  };
};

export class JoinMiddleware extends Middleware {
  public constructor(
    private config: JoinConfig,
    private foreign: Collection
  ) {
    super();
  }

  @after({
    pipe: Pipe.Find
  })
  private async joinOnFind(docs: Document[]): Promise<Document[]> {
    let ids = new Set(docs
      .map(d => this.getRef(d))
      .filter(ref => isString(ref))
    ).values();
    let others = await this.foreign.find({_id: {'$in': ids}});
    for (let doc of docs) {
      let other = others.find(o => o === this.getRef(doc));
      if (other) {
        this.setRef(doc, other);
      }
    }
    return docs;
  }

  @after({
    pipe: Pipe.FindOne
  })
  private async joinOnFindOne(doc: Document): Promise<Document> {
    return this.joinSingle(doc);
  }

  @after({
    pipe: Pipe.Upsert
  })
  private async joinOnUpsert(doc: Document): Promise<Document> {
    return this.joinSingle(doc);
  }

  @before({
    pipe: Pipe.Upsert,
    step: Step.Persist
  })
  private async disjoinOnPersist(doc: Document): Promise<Document> {
    let ref = this.getRef(doc);
    if (ref instanceof Document) {
      this.setRef(doc, ref._id);
    }
    return doc;
  }

  private async joinSingle(doc: Document): Promise<Document> {
    let ref = this.getRef(doc);
    if (isString(ref)) {
      this.setRef(doc, await this.foreign.findOne({_id: ref}));
    }
    return doc;
  }

  private setRef(doc: Document, other: any) {
    (<any>doc)[this.config.key] = other;
  }

  private getRef(doc: Document) {
    return (<any>doc)[this.config.key];
  }
}
