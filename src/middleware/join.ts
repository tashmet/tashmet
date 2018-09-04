import {Injector, ServiceIdentifier} from '@ziggurat/tiamat';
import {after, Middleware} from '@ziggurat/ningal';
import {Collection, Pipe} from '../interfaces';
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
    return docs;
  }

  @after({
    pipe: Pipe.Upsert
  })
  private async joinOnUpsert(doc: Document): Promise<Document> {
    let id = (<any>doc)[this.config.key];
    let obj = await this.foreign.findOne({_id: id});
    (<any>doc)[this.config.key] = obj;
    return doc;
  }
}
