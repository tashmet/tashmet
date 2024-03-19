# Providers

Providers allow us to register services with the container for later resolution. They can be added either statically to a component's list of providers or dynamically to the container during bootstrapping.

A provider is made up of a service identifier and a [resolver](resolvers.md). When the container is solicited for a service with that identifier, either by calling resolve on the container directly or through injection, the resolver will be tasked with supplying an instance.

## Instance

The simplest form of provider is a value.

```typescript
Provider.ofInstance('foo', 'bar');
```

## Class

A class can be provided to the container given its constructor and an optional key. If the key is omitted the constructor will serve as key. An optional list of service requests that will be resolved and injected into the constructor can also be supplied via the inject property. The transient option can also be omitted, in which case the class will be registered in singleton scope.

```typescript
Provider.ofClass({
  key: 'MyClass'
  ctr: MyClass,
  inject: [OtherService],
  transient: true
});
```

### Class decorator

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

## Factory

A factory is a provider that resolves by running a create method. The example below is the equivalent of the class provider above,

```typescript
Provider.ofFactory({
  key: 'MyClass',
  inject: [OtherService],
  transient: true,
  create: (service: OtherService) => new MyClass(service)
});
```

## Resolver

A provider can also be created directly from a [resolver](resolvers.md). This can be useful for creating, for instance, an alias. The provider below will turn out instances of another service given that service has been registered, without throwing an exception if it has not.

```typescript
Provider.ofResolver('MyService', Optional.of('OtherService'));
```

