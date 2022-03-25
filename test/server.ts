import Tashmet, {provider} from '../packages/tashmet/dist'
import Memory from '../packages/memory/dist'
import HttpServer from '../packages/http-server/dist';
import operators from '../packages/operators/system';

@provider({
  inject: [Tashmet, HttpServer]
})
class ServerApp {
  public constructor(private tashmet: Tashmet, private server: HttpServer) {}

  public run(port: number) {
    const collection = this.tashmet
      .db('serverdb')
      .collection('test');

    this.server
      .resource('/api/test', {collection})
      .listen(port);
  }
}

Tashmet
  .configure()
  .use(Memory, {operators})
  .use(HttpServer, {})
  .bootstrap(ServerApp)
  .then(app => app.run(8000));
