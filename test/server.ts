import Tashmit, {Container} from '../packages/tashmit/dist'
import Memory from '../packages/memory/dist'
import HttpServer from '../packages/http-server/dist';
import operators from '../packages/operators/system';

const container = new Tashmit()
  .use(Memory, {operators})
  .use(HttpServer, {})
  .bootstrap(Container);

const collection = container
  .resolve(Memory)
  .db('serverdb')
  .collection('test');

container
  .resolve(HttpServer)
  .resource('/api/test', {collection})
  .listen(8000);
