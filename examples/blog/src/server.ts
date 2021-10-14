import {
  bootstrap, component, logging, LogLevel, Database,
} from '@tashmit/tashmit';
import {caching} from '@tashmit/caching';
import {yaml, directoryContent} from '@tashmit/file';
import {resource, Server} from '@tashmit/server';
import {terminal} from '@tashmit/terminal';
import {validation, ValidationPipeStrategy} from '@tashmit/schema';
import {vinylfs} from '@tashmit/vinyl';
import operators from '@tashmit/operators/system';

@component({
  dependencies: [
    import('@tashmit/file'),
    import('@tashmit/server'),
    import('@tashmit/schema'),
    import('@tashmit/vinyl'),
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
