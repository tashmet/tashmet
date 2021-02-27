---
description: Serving content and making it accessible online
---

# Tashmetu

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

### 

### Controllers

A controller is a class with methods that handle HTTP requests. It can then be turned into a router and mounted on the server.

To create a controller, define a class and decorate its methods to turn them into HTTP request handlers.

```typescript
class MyController {
  @get('/')
  public async getRoot() {
    return 'Hello World!';
  }
}
```

#### Class

The class can be decorated as a provider if you wish to inject dependencies or assign it a different service identifier than the constructor.

#### Methods

The methods optionally accept the same input as a regular express request handler, i.e. **express.Request**, **express.Response** and **express.NextFunction** in that order. The result can either be sent though the response or returned as a promise.

#### Mounting

A controller must be added as a provider to the container. It can then be mounted as middleware in the server configuration by passing the service identifier \(in this case the constructor\) to the router factory function.

```typescript
@component({
  providers: [
    MyController,
    Provider.ofInstance<ServerConfig>('tashmetu.ServerConfig', {
      middleware: {
        '/': router(MyController)
      }
    })
  ]
})
class Application {}
```

