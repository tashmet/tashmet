import {Pipe, Component, step} from '@ziggurat/ningal';
import {Collection} from '../interfaces';
import {Document} from '../models/document';

export class RemovePipe extends Component<object, Document[]> {
  public constructor(
    private source: Collection,
    private cache: Collection
  ) {
    super();
  }

  public async process(selector: object): Promise<Document[]> {
    for (let doc of await this.source.find(selector)) {
      await this.unpersist(doc);
    }
    let affected = await this.cache.find(selector);
    for (let doc of affected) {
      await this.uncache(doc);
    }
    return affected;
  }

  @step('unpersist')
  private async unpersist(doc: Document): Promise<Document> {
    await this.source.remove({_id: doc._id});
    return doc;
  }

  @step('uncache')
  private async uncache(doc: Document): Promise<Document> {
    await this.cache.remove({_id: doc._id});
    return doc;
  }
}
