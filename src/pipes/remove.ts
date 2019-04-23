import {Component, step} from '@ziggurat/ningal';
import {Collection} from '../interfaces';

export class RemovePipe<U> extends Component<object, U[]> {
  public constructor(
    private source: Collection<U>,
    private cache: Collection<U>
  ) {
    super();
  }

  public async process(selector: object): Promise<U[]> {
    await this.unpersist(selector);
    return this.uncache(selector);
  }

  @step('unpersist')
  private async unpersist(selector: object): Promise<U[]> {
    return this.source.remove(selector);
  }

  @step('uncache')
  private async uncache(selector: object): Promise<U[]> {
    return this.cache.remove(selector);
  }
}
