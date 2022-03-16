import Tashmit, {provider} from '../packages/tashmit/dist'
import Memory from '../packages/memory/dist'
import HttpServer from '../packages/http-server/dist';
import operators from '../packages/operators/system';

@provider({
  inject: [Tashmit, HttpServer]
})
class ServerApp {
  public constructor(private tashmit: Tashmit, private server: HttpServer) {}

  public run(port: number) {
    const collection = this.tashmit
      .db('serverdb')
      .collection('test');

    this.server
      .resource('/api/test', {collection})
      .listen(port);
  }
}

Tashmit
  .configure()
  .use(Memory, {operators})
  .use(HttpServer, {})
  .provide(ServerApp)
  .bootstrap(ServerApp)
  .then(app => app.run(8000));
