---
description: A simple blog application with server and client
---

# Blog

In the following example we'll create an application that publishes blog posts written in text files with YAML front-matter. The application consists of a server and a client that needs to be run separately \(the client typically running in the browser\).

The blog posts can be edited with a regular text editor. The server will listen for file changes and push the content to the client through a socket once it has been validated.

## Content

We'll have a directory for storing posts and one for storing our schemas. Notice that the schema requires a property called _articleBody._ This property will correspond to the text below the front-matter, as configured in the server.

{% tabs %}
{% tab title="posts/helloworld.yaml" %}
```yaml
---
datePublished: '2020-03-22T22:49:33.610Z'
---
Hello World!
```
{% endtab %}

{% tab title="schemas/BlogPosting.schema.yaml" %}
```yaml
"$id": https://example.com/BlogPosting.schema.yaml
"$schema": http://json-schema.org/draft-07/schema#
title: BlogPosting
type: object
required:
  - articleBody
  - datePublished
properties:
  articleBody:
    type: string
    description: The actual body of the article.
  datePublished:
    type: string
    format: date-time
    description: Date of first broadcast/publication.
```
{% endtab %}
{% endtabs %}

## Server

In the server we configure our database to have one collection for posts and one for schemas. The posts collection will use middleware for schema validation and logging so that we can see when a post has been updated or if it has validation issues.

A RESTful resource is created to serve the posts at an API endpoint. This resource will also push changes through socket. Running the server in node should make the posts available at [http://localhost:8000/api/posts](http://localhost:8000/api/posts)

```typescript
import {
  bootstrap, component, logging, LogLevel, Database
} from '@tashmet/tashmet';
import {caching} from '@tashmet/caching';
import {yaml, directoryContent} from '@tashmet/nabu';
import {resource, Server} from '@tashmet/server';
import {terminal} from '@tashmet/terminal';
import {validation, ValidationPipeStrategy} from '@tashmet/schema';
import {vinylfs} from '@tashmet/vinyl';

@component({
  dependencies: [
    import('@tashmet/nabu'),
    import('@tashmet/server'),
    import('@tashmet/schema'),
    import('@tashmet/vinyl'),
  ],
  providers: [
    Database.configuration({
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
```

## Client

The client sets up the database with the collection of posts being available through an http collection. For improved performance we apply a caching middleware to all collections so that posts don't have to be fetched from server every time. In the application we acquire the collection and print out the list of posts to the console.

```typescript
import {bootstrap, component, Database, http} from '@tashmet/tashmet';
import {caching} from '@tashmet/caching';

@component({
  providers: [
    Database.configuration({
      collections: {
        'posts': http({path: 'http://localhost:8000/api/posts'})
      },
      use: [caching()],
    }),
  ],
  inject: [Database],
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

For testing purposes you can also run the client in another terminal in node.

