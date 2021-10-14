import {parseQs, makeQuery, intParamParser} from './common';

function parseJson(input: any): Record<string, any> {
  try {
    return JSON.parse(input);
  } catch (e) {
    return {};
  }
}

export interface JsonQueryParserConfig {
  filter?: string;
  sort?: string;
  skip?: string;
  limit?: string;
  projection?: string;
}

export const jsonParamParser = (part: 'filter' | 'sort' | 'projection', param?: string) => {
  return (qs: string) => {
    const pqs = parseQs(qs);
    return (param || part) in pqs
    ? ({[part]: parseJson(pqs[param || part])})
    : ({});
  }
}

export const jsonQueryParser = (config?: JsonQueryParserConfig | string) =>
  (qs: string) => typeof config === 'string'
    ? parseJson(parseQs(qs)[config])
    : makeQuery(qs, [
      jsonParamParser('filter', config?.filter),
      jsonParamParser('sort', config?.sort),
      jsonParamParser('projection', config?.sort),
      intParamParser('skip', config?.skip),
      intParamParser('limit', config?.limit)
    ]);
