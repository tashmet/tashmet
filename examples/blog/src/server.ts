import Tashmit, {logging, LogLevel} from '@tashmit/tashmit';
import {caching} from '@tashmit/caching';
import {yaml, directoryContent} from '@tashmit/file';
import Vinyl from '@tashmit/vinyl';
import HttpServer, {QueryParser} from '@tashmit/http-server';
import {terminal} from '@tashmit/terminal';
import Schema, {validation, ValidationPipeStrategy} from '@tashmit/schema';
import operators from '@tashmit/operators/system';

Tashmit
  .withConfiguration({
    logLevel: LogLevel.Debug,
    logFormat: terminal(),
    operators,
  })
  .collection('schemas', directoryContent({
    path: 'schemas',
    extension: 'yaml',
    serializer: yaml(),
  }))
  .collection('posts', {
    source: directoryContent({
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
    ],
  })
  .provide(
    new Vinyl({watch: false}),
    new Schema({collection: 'schemas'}),
    new HttpServer({queryParser: QueryParser.flat()})
      .resource('/api/posts', {collection: 'posts'})
  )
  .bootstrap(HttpServer.http, server => server.listen(8000));
