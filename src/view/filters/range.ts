import {QueryOptions} from '../../interfaces';
import {Filter, RangeConfig} from '../interfaces';
import {View} from '../view';
import {EventEmitter} from 'eventemitter3';

export class RangeFilter extends EventEmitter implements Filter {
  public constructor(
    private config: RangeConfig
  ) {
    super();
  }

  public get offset(): number {
    return this.config.offset || 0;
  }

  public set offset(o: number) {
    this.config.offset = o;
  }

  public get length(): number {
    return this.config.length;
  }

  public set length(l: number) {
    this.config.length = l;
  }

  public apply(selector: any, options: QueryOptions): void {
    options.offset = this.offset;
    options.limit = this.length;
  }
}
