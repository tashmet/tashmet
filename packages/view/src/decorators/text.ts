import {propertyDecorator} from '@ziqquratu/core';
import {FilterAnnotation, FilterConfig} from './filter';

/**
 * Configuration options for text search filter
 */
export interface TextConfig {
  /**
   * One or more keys where one of the values should match the search string
   */
  key: string | string[];

  /**
   * Optional. A boolean flag to enable or disable case sensitive search.
   * Defaults to false; i.e. the search defers to the case insensitivity of the
   * text index.
   */
  caseSensitive?: boolean;
}

/**
 * Filter documents using text search.
 */
export function text(config: TextConfig) {
  return propertyDecorator<string>(({propertyKey}) => {
    const key = config.key;
    const createQuery = (v: string = '') =>
      ({ $regex: v, $options: config.caseSensitive ? '' : 'i'});

    const filterConfig: FilterConfig<string> = {
      compile: value => Array.isArray(key)
        ? ({$or: key.map(k => ({[k]: createQuery(value)}))})
        : ({[key]: createQuery(value)}),
      disableOn: ''
    };

    return new FilterAnnotation(filterConfig, propertyKey)
  });
}
