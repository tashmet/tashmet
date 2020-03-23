---
description: A simple blog with server and client
---

# Blog



{% tabs %}
{% tab title="server.ts" %}
```typescript
import {
  bootstrap, component, logging, LogLevel, Provider, DatabaseConfig,
} from '@ziqquratu/ziqquratu';
import {yaml, directory, json, FileSystemConfig} from '@ziqquratu/nabu';
import {resource, Server, ServerConfig} from '@ziqquratu/tashmetu';
import {terminal} from '@ziqquratu/terminal';
import {schema} from '@ziqquratu/schema';

@component({
  dependencies: [
    import('@ziqquratu/nabu'),
    import('@ziqquratu/tashmetu'),
    import('@ziqquratu/schema'),
  ],
  providers: [
    Provider.ofInstance<DatabaseConfig>('ziqquratu.DatabaseConfig', {
      collections: {
        'schemas': directory({
          path: 'schemas',
          extension: 'json',
          serializer: json(),
        }),
        'posts': {
          source: directory({
            path: 'posts',
            extension: 'yaml',
            serializer: yaml({
              frontMatter: true,
              contentKey: 'articleBody',
            }),
          }),
          use: [
            logging(),
            schema('https://example.com/BlogPosting.schema.json')
          ]
        }
      },
    }),
    Provider.ofInstance<ServerConfig>('tashmetu.ServerConfig', {
      middleware: {
        '/api/posts': resource({collection: 'posts'}),
      }
    }),
    Provider.ofInstance<FileSystemConfig>('nabu.FileSystemConfig', {
      watch: true,
    }),
  ],
  inject: ['tashmetu.Server'],
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
```
{% endtab %}

{% tab title="client.ts" %}
```typescript
import {bootstrap, component, Database, Provider, DatabaseConfig, http} from '@ziqquratu/ziqquratu';
import {caching} from '@ziqquratu/caching';

@component({
  providers: [
    Provider.ofInstance<DatabaseConfig>('ziqquratu.DatabaseConfig', {
      collections: {
        'posts': http({path: 'http://localhost:8000/api/posts'})
      },
      use: [caching()],
    }),
  ],
  inject: ['ziqquratu.Database'],
})
export class Application {
  constructor(private database: Database) {}

  async run() {
    const posts = await this.database.collection('posts');
    const docs = await posts.find().toArray();
    console.log(docs);
  }
}

bootstrap(Application).then(app => app.run());
```
{% endtab %}

{% tab title="posts/helloworld.yaml" %}
```yaml
---
datePublished: '2020-03-22T22:49:33.610Z'
--- 
Hello World!
```
{% endtab %}

{% tab title="schemas/blogPosting.schema.json" %}
```javascript
{
  "$id": "https://example.com/BlogPosting.schema.json",
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BlogPosting",
  "type": "object",
  "required": ["articleBody", "datePublished"],
  "properties": {
    "articleBody": {
      "type": "string",
      "description": "The actual body of the article."
    },
    "datePublished": {
      "type": "string",
      "format": "date-time",
      "description": "Date of first broadcast/publication."
    }
  }
}
```
{% endtab %}
{% endtabs %}

