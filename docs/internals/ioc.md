# Dependency injection

## Container

The container allows us to register providers and resolve service requests. An instance of the container can be acquired either during bootstrapping of a component or injected afterwards using its service identifier.

```typescript
@provider({
  inject: [Container]
})
class MyService {
  public constructor(container: Container) {}
}
```

### Registration

A [provider](ioc.md#providers) can be registered by a class constructor

```typescript
container.register(MyService);
```

It can also be registered by an instance of the Provider class. The example below is equivalent to the one above.

```typescript
container.register(Provider.ofClass({
  ctr: MyService,
  inject: [Container]
});
```

{% hint style="info" %}
Note that we had to specify which services to inject here since the provider decorator only applies when a constructor is given directly.
{% endhint %}

We can also check if a given service has been registered.

```typescript
container.isRegistered(MyService); // true
```

### Resolution

Once a service has been registered it can be resolved using its unique service identifier. In the example above our class was provided without a key which means that the constructor itself is used as the service identifier.

```typescript
container.resolve(MyService);
```

Resolution can also be done by supplying a [resolver](ioc.md#undefined).

```typescript
container.resolve(Optional.of(MyService));
```

The above code will return _undefined_ instead of throwing an exception if _MyService_ was not previously registered.



## Providers

Providers allow us to register services with the container for later resolution. They can be added either statically to a component's list of providers or dynamically to the container during bootstrapping.

A provider is made up of a service identifier and a [resolver](ioc.md#undefined). When the container is solicited for a service with that identifier, either by calling resolve on the container directly or through injection, the resolver will be tasked with supplying an instance.

### Instance

The simplest form of provider is a value.

```typescript
Provider.ofInstance('foo', 'bar');
```

### Class

A class can be provided to the container given its constructor and an optional key. If the key is omitted the constructor will serve as key. An optional list of service requests that will be resolved and injected into the constructor can also be supplied via the inject property. The transient option can also be omitted, in which case the class will be registered in singleton scope.

```typescript
Provider.ofClass({
  key: 'MyClass'
  ctr: MyClass,
  inject: [OtherService],
  transient: true
});
```

#### Class decorator

A class can also be turned into a provider by decorating it.

```typescript
@provide({
  key: 'MyClass',
  inject: [OtherService]
  transient: true
})
class MyClass {
  public constructor(private service: OtherService) {}
}
```

### Factory

A factory is a provider that resolves by running a create method. The example below is the equivalent of the class provider above,

```typescript
Provider.ofFactory({
  key: 'MyClass',
  inject: [OtherService],
  transient: true,
  create: (service: OtherService) => new MyClass(service)
});
```

### Resolver

A provider can also be created directly from a [resolver](ioc.md#undefined). This can be useful for creating, for instance, an alias. The provider below will turn out instances of another service given that service has been registered, without throwing an exception if it has not.

```typescript
Provider.ofResolver('MyService', Optional.of('OtherService'));
```



A resolver is a proxy that acts on a container to solicit instances.

```typescript
export abstract class Resolver {
  public abstract resolve(container: Container): any;
}
```

A [provider](broken-reference) is made up of a service identifier and a resolver so they are used for registering services, but resolvers can also be used for retrieving services from the container. A service request can either be a plain service identifier or a resolver.

## Resolvers

### Instance

Resolver that stores and resolves an instance.

{% hint style="warning" %}
This resolver is primarily used internally by the container.
{% endhint %}

```typescript
@provider({
  inject: [Instance.of('Hello World!')]
})
class MyProvider {
  public constructor(public message: string) {}
}
```

### Cache

Resolver that stores a cached resolution of a given service request.

{% hint style="warning" %}
This resolver is used internally by the container to provide instances in singleton scope. It should not really be used outside.
{% endhint %}

### Injection

Resolver that injects other services into a constructor or factory function that returns the requested service.

```typescript
@provider({
  inject: [Injection.ofClass(MyClass, [Database])]
})
class MyProvider {
  public constructor(private input: MyClass) {}
}
```

### Lazy

Resolver that returns a function for lazy evaluation of a service request.

```typescript
@provider({
  inject: [Lazy.of(Database)]
})
class MyProvider {
  public constructor(private getDatabase: () => Database) {}
}
```

### Optional

Resolver that returns the resolved key if it was registered.

```typescript
@provider({
  inject: [Optional.of(Database)]
})
class MyProvider {
  public constructor(private database?: Database) {}
}
```
