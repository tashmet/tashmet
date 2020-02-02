import {Collection, MemoryCollection, MiddlewareFactory} from '@ziqquratu/database';
import {CachingMiddleware} from './middleware';
import {IDCache} from './id';
import {QueryCache} from './query';

export class CachingMiddlewareFactory extends MiddlewareFactory {
  public create(source: Collection) {
    return new CachingMiddleware(
      source, new MemoryCollection(source.name), [new QueryCache(), new IDCache()]
    );
  }
}

export const caching = () => new CachingMiddlewareFactory();
