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
    await this.unpersist(selector);
    return this.uncache(selector);
  }

  @step('unpersist')
  private async unpersist(selector: object): Promise<Document[]> {
    return this.source.remove(selector);
  }

  @step('uncache')
  private async uncache(selector: object): Promise<Document[]> {
    return this.cache.remove(selector);
  }
}
