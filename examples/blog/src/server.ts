import {
  bootstrap, component, logging, LogLevel, Database,
} from '@ziqquratu/ziqquratu';
import {caching} from '@ziqquratu/caching';
import {yaml, directoryContent} from '@ziqquratu/nabu';
import {resource, Server} from '@ziqquratu/tashmetu';
import {terminal} from '@ziqquratu/terminal';
import {validation, ValidationPipeStrategy} from '@ziqquratu/schema';
import {vinylfs} from '@ziqquratu/vinyl';
import operators from '@ziqquratu/operators/system';

@component({
  dependencies: [
    import('@ziqquratu/nabu'),
    import('@ziqquratu/tashmetu'),
    import('@ziqquratu/schema'),
    import('@ziqquratu/vinyl'),
  ],
  providers: [
    Database.configuration({
      operators,
      collections: {
        'schemas': directoryContent({
          driver: vinylfs(),
          path: 'schemas',
          extension: 'yaml',
          serializer: yaml(),
        }),
        'posts': {
          source: directoryContent({
            driver: vinylfs(),
            path: 'posts',
            extension: 'yaml',
            serializer: yaml({
              frontMatter: true,
              contentKey: 'articleBody',
            }),
          }),
          use: [
            logging(),
            caching(),
            validation({
              schema: 'https://example.com/BlogPosting.schema.yaml',
              strategy: ValidationPipeStrategy.ErrorInFilterOut
            }),
          ]
        }
      },
    }),
    Server.configuration({
      middleware: {
        '/api/posts': resource({collection: 'posts'}),
      }
    }),
  ],
  inject: [Server],
})
export class Application {
  constructor(private server: Server) {}

  async run() {
    this.server.listen(8000);
  }
}

bootstrap(Application, {
  logLevel: LogLevel.Info,
  logFormat: terminal()
}).then(app => app.run());
