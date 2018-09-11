import {Injector, ServiceIdentifier} from '@ziggurat/tiamat';
import {after, before, Middleware} from '@ziggurat/ningal';
import {Collection, Pipe, Step} from '../interfaces';
import {Controller} from '../database/controller';
import {Document} from '../models/document';

export interface JoinConfig {
  key: string;

  foreign: ServiceIdentifier<Controller>;
}

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
    let ids = new Set(docs.map(d => this.getRef(d))).values();
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
    pipe: Pipe.Upsert
  })
  private async joinOnUpsert(doc: Document): Promise<Document> {
    let id = this.getRef(doc);
    this.setRef(doc, await this.foreign.findOne({_id: id}));
    return doc;
  }

  @before({
    pipe: Pipe.SourceUpsert,
    step: Step.Persist
  })
  private async disjoinOnPersist(doc: Document): Promise<Document> {
    let ref = this.getRef(doc);
    if (ref instanceof Document) {
      this.setRef(doc, ref._id);
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
