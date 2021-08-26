import {
  bootstrap,
  component,
  Database,
  memory
} from '../packages/ziqquratu/dist';
import {resource, Server} from '../packages/tashmetu/dist';

@component({
  dependencies: [
    import('../packages/tashmetu/dist'),
  ],
  providers: [
    Database.configuration({
      collections: {
        'test': memory()
      },
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
