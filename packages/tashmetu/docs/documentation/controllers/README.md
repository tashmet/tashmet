# Controllers

## Description

A controller is a class with methods that handle HTTP requests. It can then be turned into a router and mounted on the server.

## Usage

To create a controller, define a class and decorate its methods to turn them into HTTP request handlers. 

```typescript
class MyController {
  @get('/')
  public async getRoot() {
    return 'Hello World!';
  }
}
```

### Class

The class can be decorated as a provider if you wish to inject dependencies or assign it a different service identifier than the constructor.

### Methods

The methods optionally accept the same input as a regular express request handler, i.e. **express.Request**, **express.Response** and **express.NextFunction** in that order. The result can either be sent though the response or returned as a promise.

### Mounting

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

