import {QueryOptions} from '@ziqquratu/database';

export type MakeQueryParams = (selector: object, options: QueryOptions) => {[name: string]: string};

export type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>;

export interface RestCollectionConfig {
  path: string;

  queryParams?: MakeQueryParams;

  emitter?: any;

  fetch?: Fetch;
}
