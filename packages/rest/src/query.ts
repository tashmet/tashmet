import {QueryOptions} from '@ziqquratu/database';

export const queryParams = (selector: object, options: QueryOptions): {[name: string]: string} => {
  const params: {[name: string]: string} = {};
  if (Object.keys(selector).length > 0) {
    params['selector'] = JSON.stringify(selector);
  }
  if (options.sort) {
    params['sort'] = JSON.stringify(options.sort);
  }
  if (options.skip) {
    params['skip'] = options.skip.toString();
  }
  if (options.limit) {
    params['limit'] = options.limit.toString();
  }
  return params;
}
