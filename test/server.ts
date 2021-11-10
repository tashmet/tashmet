import Tashmit from '../packages/tashmit'
import HttpServer from '../packages/http-server/dist';
import operators from '../packages/operators/system';

Tashmit
  .withConfiguration({operators})
  .collection('test', [])
  .provide(
    new HttpServer().resource('/api/test', {collection: 'test'})
  )
  .bootstrap(HttpServer.http, server => server.listen(8000));
