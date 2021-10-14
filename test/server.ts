import {
  bootstrap,
  component,
  Database,
  memory
} from '../packages/tashmit/dist';
import {resource, Server} from '../packages/server/dist';
import operators from '../packages/operators/system';

@component({
  dependencies: [
    import('../packages/server/dist'),
  ],
  providers: [
    Database.configuration({
      collections: {
        'test': memory()
      },
      operators,
    }),
    Server.configuration({
      middleware: {
        '/api/test': resource({ collection: 'test' }),
      }
    }),
  ],
  inject: [Server],
})
export class Application {
  constructor(
    private server: Server,
  ) {}

  async run() {
    this.server.listen(8000);
  }
}

bootstrap(Application).then(app => app.run());
