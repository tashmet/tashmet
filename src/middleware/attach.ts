import {Injector, ServiceIdentifier} from '@ziggurat/tiamat';
import {after, Middleware} from '@ziggurat/ningal';
import {Collection, Pipe} from '../interfaces';
import {Controller} from '../database/controller';
import {Document} from '../models/document';

export interface AttachConfig {
  key: string;

  foreign: ServiceIdentifier<Controller>;
}

export const attach = (config: AttachConfig) => {
  return (injector: Injector, controller: Controller): Middleware  => {
    let foreign = injector.get<Collection>(config.foreign);
    return new AttachMiddleware(config, foreign);
  };
};

export class AttachMiddleware extends Middleware {
  public constructor(
    private config: AttachConfig,
    private foreign: Collection
  ) {
    super();
  }

  @after({
    pipe: Pipe.Find
  })
  private async attachOnFind(docs: Document[]): Promise<Document[]> {
    return docs;
  }

  @after({
    pipe: Pipe.Upsert
  })
  private async attachOnUpsert(doc: Document): Promise<Document> {
    let id = (<any>doc)[this.config.key];
    let obj = await this.foreign.findOne({_id: id});
    (<any>doc)[this.config.key] = obj;
    return doc;
  }
}
