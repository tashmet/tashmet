# Server

## Description <a id="description"></a>

Tashmetu is an HTTP server for publishing Ziqquratu content. It allows us to define RESTful resources that interact with the database.

## Installation <a id="installation"></a>

```text
$ npm install @ziqquratu/tashmetu
```

## Usage <a id="usage"></a>

The package exports a component that should be imported as a dependency in your application. The configuration can then be defined as a provider and the server injected and started.

```typescript
@component({
  dependencies: [
    import('@ziqquratu/tashmetu')
  ],
  providers: [
    Provider.ofInstance<ServerConfig>('tashmetu.ServerConfig', {
      middleware: {
        '/api/posts': resource({collection: 'posts', readOnly: true})
      }
    })
  ],
  inject: ['tashmetu.Server']
})
class Application {
  constructor(private server: Server) {}

  public run(port: number) {
    this.server.listen(port);
  }
}

bootstrap(Application).then(app => app.run(8080));
```

