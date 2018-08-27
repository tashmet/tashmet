import {QueryOptions} from '../../interfaces';
import {Filter, RangeConfig} from '../interfaces';

export class RangeFilter extends Filter {
  public offset: number;
  public length: number;

  public constructor(
    config: RangeConfig
  ) {
    super(config);
    this.offset = config.offset || 0;
    this.length = config.length;
  }

  public apply(selector: any, options: QueryOptions): void {
    options.offset = this.offset;
    options.limit = this.length;
  }
}
