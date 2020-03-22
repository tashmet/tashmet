import {
  bootstrap,
  component,
  Provider,
  DatabaseConfig,
  memory
} from '../packages/ziqquratu/dist';
import {ServerConfig, resource, Server} from '../packages/tashmetu/dist';

@component({
  dependencies: [
    import('../packages/tashmetu/dist'),
  ],
  providers: [
    Provider.ofInstance<DatabaseConfig>('ziqquratu.DatabaseConfig', {
      collections: {
        'test': memory()
      },
    }),
    Provider.ofInstance<ServerConfig>('tashmetu.ServerConfig', {
      middleware: {
        '/api/test': resource({ collection: 'test' }),
      }
    }),
  ],
  inject: ['tashmetu.Server'],
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
