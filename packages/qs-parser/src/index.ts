import {Filter, Projection, SortingMap} from '@tashmit/database';
import {parse as parseQs} from 'qs';
import {merge} from 'mingo/util';
import {
  DelimitedSortConfig,
  FlatFilterConfig,
  NestedFilterConfig,
  NestedSortConfig,
  OperatorParserConfig
} from './interfaces';

const queryTypes = require('query-types');

const defaultNestedSortConfig: NestedSortConfig = {
  param: 'sort', asc: '1', desc: '-1',
}

const defaultDelimitedSortConfig: DelimitedSortConfig = {
  param: 'sort', asc: /^(?!-)(.+)/, desc: /\-(.*?)$/, delimiter: ','
}

const defaultNestedFilterConfig: NestedFilterConfig = {
  param: 'filter', types: true,
}

export * from './interfaces';

export class QueryString {
  public readonly data: Record<string, any>;
  public readonly dataTyped: Record<string, any>;

  public constructor(
    public readonly raw: string,
  ) {
    this.data = parseQs(raw);
    this.dataTyped = queryTypes.parseObject(this.data);
  }

  public flatFilter(config: FlatFilterConfig) {
    let filter: Filter<any> = {};

    const toOperator = (op: string) => `$${op}`;
    const makeFilter = (field: string, op: string, value: string) =>
      ({[field]: {[toOperator(op)]: queryTypes.parseValue(value)}});

    const parseFilter = (lhs: string, rhs: string | string[], operatorConfig: OperatorParserConfig) => {
      if (operatorConfig.rhs) {
        let f: any = {};
        for (const rhsItem of Array.isArray(rhs) ? rhs : [rhs]) {
          const result = operatorConfig.pattern.exec(rhsItem);
          merge(f, result ? makeFilter(lhs, result[1], result[2]) : {});
        }
        return f;
      } else if (!Array.isArray(rhs)) {
        const result = operatorConfig.pattern.exec(lhs);
        if (result) {
          return makeFilter(result[1], result[2], rhs);
        }
      }
      return ({[lhs]: rhs});
    }

    for (const [lhs, rhs] of Object.entries<any>(this.dataTyped)) {
      if (!config.exclude.includes(lhs)) {
        merge(filter, config.operator
          ? parseFilter(lhs, rhs, config.operator)
          : ({[lhs]: rhs}));
      }
    }
    return filter;
  }

  public nestedFilter(config?: Partial<NestedFilterConfig>) {
    const {param, types} = {...defaultNestedFilterConfig, ...config};
    return types ? this.dataTyped[param] : this.data[param];
  }

  public delimitedSort(config?: Partial<DelimitedSortConfig>): SortingMap | undefined {
    const {param, asc, desc, delimiter} = {...defaultDelimitedSortConfig, ...config};

    const sorting = (fields: string[]) => fields.reduce((sort, field) => {
      const ascMatch = asc.exec(field);
      const descMatch = desc.exec(field);
      if (ascMatch) {
        sort[ascMatch[1]] = 1;
      } else if (descMatch) {
        sort[descMatch[1]] = -1;
      }
      return sort;
    }, {} as SortingMap);

    const value = this.data[param];

    return typeof value === 'string'
      ? sorting(value.split(delimiter))
      : undefined;
  }

  public nestedSort(config?: NestedSortConfig): SortingMap | undefined {
    const {param, asc, desc} = {...defaultNestedSortConfig, ...config};

    const match = (options: string | string[], value: string) =>
      (Array.isArray(options) ? options : [options]).includes(value);

    const sort: SortingMap = {};
    const value = this.data[param];
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }
    for (const [k, v] of Object.entries(value)) {
      if (typeof v === 'string') {
        if (match(asc, v)) {
          sort[k] = 1;
        } else if (match(desc, v)) {
          sort[k] = -1;
        }
      }
    }
    return sort;
  }

  public delimitedProjection(param: string = 'projection') {
    const projection = (fields: string[]) => fields.reduce((p, field) => {
      p[field] = 1;
      return p;
    }, {} as Projection<any>)

    const value = this.data[param];

    return typeof value === 'string'
      ? projection(value.split(','))
      : undefined;
  }
}
