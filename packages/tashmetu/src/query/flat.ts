import {makeQuery, intParamParser} from './common';
import {OperatorParserConfig, flatFilter} from './filter';
import {delimitedProjection} from './projection';
import {delimitedSort, DelimitedSortConfig} from './sort';


export interface FlatQueryParserConfig {
  operator?: OperatorParserConfig;
  sort?: DelimitedSortConfig;
  skip?: string;
  limit?: string;
  projection?: string;
}

export const flatQueryParser = (config?: FlatQueryParserConfig) => (qs: string) =>
  makeQuery(qs, [
    flatFilter({
      operator: config?.operator,
      exclude: [
        config?.sort?.param || 'sort',
        config?.skip || 'skip',
        config?.limit || 'limit',
        config?.projection || 'projection',
      ]
    }),
    delimitedSort(config?.sort),
    delimitedProjection(config?.projection),
    intParamParser('skip', config?.skip),
    intParamParser('limit', config?.limit),
  ]);
