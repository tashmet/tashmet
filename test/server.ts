import Tashmit, {Container} from '../packages/tashmit/dist'
import Memory from '../packages/database/dist'
import HttpServer from '../packages/http-server/dist';
import operators from '../packages/operators/system';

const container = Tashmit
  .withConfiguration({operators})
  .use(HttpServer.configure())
  .bootstrap(Container);

const collection = container
  .resolve(Memory)
  .db('serverdb')
  .collection('test');

container
  .resolve(HttpServer)
  .resource('/api/test', {collection})
  .listen(8000);
