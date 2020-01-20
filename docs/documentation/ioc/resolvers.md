# Resolvers

A resolver is a proxy that acts on a container to solicit instances.

```typescript
export abstract class Resolver {
  public abstract resolve(container: Container): any;
}
```

A [provider](providers.md) is made up of a service identifier and a resolver so they are used for registering services, but resolvers can also be used for retrieving services from the container. A service request can either be a plain service identifier or a resolver.

## Instance

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

## Cache

Resolver that stores a cached resolution of a given service request.

{% hint style="warning" %}
This resolver is used internally by the container to provide instances in singleton scope. It should not really be used outside.
{% endhint %}

## Injection

Resolver that injects other services into a constructor or factory function that returns the requested service.

```typescript
@provider({
  inject: [Injection.ofClass(MyClass, ['ziqquratu.Database'])]
})
class MyProvider {
  public constructor(private input: MyClass) {}
}
```

## Lazy

Resolver that returns a function for lazy evaluation of a service request.

```typescript
@provider({
  inject: [Lazy.of('ziqquratu.Database')]
})
class MyProvider {
  public constructor(private getDatabase: () => Database) {}
}
```

## Optional

Resolver that returns the resolved key if it was registered.

```typescript
@provider({
  inject: [Optional.of('ziqquratu.Database')]
})
class MyProvider {
  public constructor(private database?: Database) {}
}
```

