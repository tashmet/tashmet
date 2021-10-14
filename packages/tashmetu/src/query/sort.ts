import {SortingMap} from '@ziqquratu/ziqquratu';
import {parseQs} from './common';

export interface NestedSortConfig {
  param: string;
  asc: string | string[];
  desc: string | string[];
}

const defaultNestedSortConfig: NestedSortConfig = {
  param: 'sort', asc: '1', desc: '-1',
}

export const nestedSort = (config?: NestedSortConfig) => {
  const {param, asc, desc} = Object.assign({}, defaultNestedSortConfig, config);

  return (qs: string) => {
    const match = (options: string | string[], value: string) =>
      (Array.isArray(options) ? options : [options]).includes(value);

    const pqs = parseQs(qs, {types: false});
    const sort: SortingMap = {};
    const value = pqs[param];
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw Error('Failed to parse sort');
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
    return {sort};
  }
}

export interface DelimitedSortConfig {
  param: string;
  asc: RegExp;
  desc: RegExp;
  delimiter: string;
}

const defaultDelimitedSortConfig: DelimitedSortConfig = {
  param: 'sort', asc: /^(?!-)(.+)/, desc: /\-(.*?)$/, delimiter: ','
}

export const delimitedSort = (config?: Partial<DelimitedSortConfig>) => {
  const {param, asc, desc, delimiter} = Object.assign({}, config, defaultDelimitedSortConfig);

  return (qs: string) => {
    const pqs = parseQs(qs);
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

    const value = pqs[param];

    return typeof value === 'string'
      ? ({sort: sorting(value.split(delimiter))})
      : ({});
  }
}