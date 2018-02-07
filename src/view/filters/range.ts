import {QueryOptions} from '../../interfaces';
import {Filter, RangeConfig} from '../interfaces';
import {View} from '../view';
import {EventEmitter} from 'eventemitter3';

export class RangeFilter extends Filter {
  public offset: number;
  public length: number;

  public constructor(
    config: RangeConfig
  ) {
    super();
    this.offset = config.offset || 0;
    this.length = config.length;
  }

  public apply(selector: any, options: QueryOptions): void {
    options.offset = this.offset;
    options.limit = this.length;
  }
}
