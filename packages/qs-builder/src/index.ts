import {Query, SortingDirection} from "@tashmit/database";
import {
  DelimitedProjectionConfig,
  DelimitedSortConfig,
  FlatFilterConfig,
  FlatQueryConfig,
  JsonQueryConfig,
  NestedFilterConfig,
  NestedProjectionConfig,
  NestedQueryConfig,
  OperatorFormat,
  Param,
} from "./interfaces";

export * from './interfaces';

const qsStringify = require('qs-stringify');

export type QueryStringBuilder = (writer: QueryStringWriter) => string[];

export class QuerySerializer {
  public constructor(
    private builder: QueryStringBuilder
  ) {}

  public static configure(builder: QueryStringBuilder) {
    return new QuerySerializer(builder);
  }

  public static json(config?: JsonQueryConfig) {
    return QuerySerializer.configure(writer => [
      writer.json(config?.filter || 'filter', 'filter'),
      writer.json(config?.sort || 'sort', 'sort'),
      writer.json(config?.projection || 'projection', 'projection'),
      writer.number(config?.skip || 'skip', 'skip'),
      writer.number(config?.limit || 'limit', 'limit'),
    ]);
  }

  public static flat(config?: FlatQueryConfig) {
    return QuerySerializer.configure(writer => [
      writer.flatFilter(config?.filter || {format: lhsColon}),
      writer.delimitedSort(config?.sort),
      writer.delimitedProjection(config?.projection),
      writer.number(config?.skip || 'skip', 'skip'),
      writer.number(config?.limit || 'limit', 'limit'),
    ]);
  }

  public static nested(config?: NestedQueryConfig) {
    return QuerySerializer.configure(writer => [
      writer.nestedFilter(config?.filter),
      writer.nestedSort(config?.sort),
      writer.nestedProjection(config?.projection),
      writer.number(config?.skip || 'skip', 'skip'),
      writer.number(config?.limit || 'limit', 'limit'),
    ]);
  }

  public serialize(query: Query): string {
    return this.builder(new QueryStringWriter(query))
      .filter(part => part !== '')
      .join('&');
  }
}

export const lhsBrackets: OperatorFormat = (k, v, op) => new Param(`${k}[${op}]`, v);
export const lhsColon: OperatorFormat = (k, v, op) => new Param(`${k}:${op}`, v);
export const rhsColon: OperatorFormat = (k, v, op) => new Param(k, `${op}:${v}`);

const defaultSortConfig: DelimitedSortConfig = {
  param: 'sort', asc: k => k, desc: k => `-${k}`, separator: ',',
}

const defaultProjectionConfig: DelimitedProjectionConfig = {
  param: 'projection', include: f => f, exclude: f => `-${f}`, separator: ',',
}

const defaultNestedProjectionConfig: NestedProjectionConfig = {
  param: 'projection', value: v => +v
}

const defaultNestedFilterConfig: NestedFilterConfig = {
  root: 'filter',
};

export class QueryStringWriter {
  public constructor(public readonly query: Query) {}

  public flatFilter(config: FlatFilterConfig) {
    const defaultAlias = (op: string) => op.substr(1);
    const alias = config.alias || defaultAlias;

    const filter = this.query.filter || {};
    const format = (key: string, value: any, op: string) => {
      return (op === '$eq')
        ? new Param(key, value)
        : config.format(key, value, alias(op));
    }

    const serializeValue = (v: any): any =>
      Array.isArray(v) ? v.map(serializeValue).join(',') : encodeURIComponent(v);

    const isExpr = (v: any) => typeof v === 'object' && !Array.isArray(v);
    const makeParams = (k: string, v: any) => isExpr(v)
      ? Object.keys(v).map(op => format(k, serializeValue(v[op]), op))
      : new Param(k, serializeValue(v))

    return Object.entries<any>(filter)
      .reduce<Param[]>((params, [k, v]) => params.concat(makeParams(k, v)), [])
      .filter(p => p.value !== undefined)
      .map(p => p.toString())
      .join('&');
  }

  public nestedFilter(config?: Partial<NestedFilterConfig>) {
    const {root} = {...defaultNestedFilterConfig, ...config};

    return qsStringify(root ? {[root]: this.query.filter} : this.query.filter);
  }


  /**
   * Parameter factory that creates a sort parameter
   *
   * Given a sorting map:
   * ```typescript
   * {
   *   foo: 1
   *   bar: -1
   * }
   * ```
   *
   * A parameter will be produced on the following format
   * ```typescript
   * 'sort=foo,-bar'
   * ```
   *
   * @param config Configuration options
   * @returns A parameter factory
   */
  public delimitedSort(config?: Partial<DelimitedSortConfig>): string {
    const {param, asc, desc, separator} = {...defaultSortConfig, ...config};

    const value = Object.entries(this.query.sort || {})
      .filter(([k, v ]) => v !== undefined)
      .map(([k, v]) => v === SortingDirection.Ascending ? asc(k) : desc(k))
      .join(separator);
    return new Param(param, value).toString();
  }

  public nestedSort(param: string = 'sort') {
    return qsStringify({[param]: this.query.sort});
  }

  /**
   * Parameter factory that creates a projection parameter
   *
   * Given a projection map:
   * ```typescript
   * {
   *   foo: 1,
   *   bar: 1,
   * }
   * ```
   *
   * A parameter will be produced on the following format
   * ```typescript
   * 'projection=foo,bar'
   * ```
   *
   * @param config Configuration options
   * @returns A parameter factory
   */
  public delimitedProjection(config?: Partial<DelimitedProjectionConfig>): string {
    const {param, include, exclude, separator} = {...defaultProjectionConfig, ...config};

    const {_id, ...projection} = this.query.projection || {};
    const isInclusion = Object.values(projection).some(v => v)
    const fields = Object.entries(projection)
      .filter(([k, v]) => v !== undefined && !!v === isInclusion)
      .map(([k, v]) => k);

    return new Param(
      typeof param === 'string' ? param : param(isInclusion),
      fields.map(isInclusion ? include : exclude).join(separator)
    ).toString();
  }

  public nestedProjection(config?: Partial<NestedProjectionConfig>) {
    const {param, value} = {...defaultNestedProjectionConfig, ...config};

    return qsStringify({[param]: Object.entries(this.query.projection || {})
      .reduce((p, [k, v]) => {
        if (v !== undefined) {
          p[k] = value(v);
        }
        return p;
      }, {} as any)});
  }

  public json(param: string, key: 'filter' | 'sort' | 'projection'): string {
    return new Param(param, JSON.stringify(this.query[key])).toString();
  }

  public number(param: string, key: 'skip' | 'limit'): string {
    return new Param(param, this.query[key]).toString();
  }
}
