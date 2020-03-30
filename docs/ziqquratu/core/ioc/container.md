# Container

The container allows us to register providers and resolve service requests. An instance of the container can be acquired either during bootstrapping of a [component](components.md) or injected afterwards using its service identifier.

```typescript
@provider({
  inject: ['ziqquratu.Container']
})
class MyService {
  public constructor(container: Container) {}
}
```

## Registration

A [provider](providers.md) can be registered by a class constructor

```typescript
container.register(MyService);
```

It can also be registered by an instance of the Provider class. The example below is equivalent to the one above.

```typescript
container.register(Provider.ofClass({
  ctr: MyService,
  inject: ['ziqquratu.Container']
});
```

{% hint style="info" %}
Note that we had to specify which services to inject here since the provider decorator only applies when a constructor is given directly.
{% endhint %}

We can also check if a given service has been registered.

```typescript
container.isRegistered(MyService); // true
```

## Resolution

Once a service has been registered it can be resolved using its unique service identifier. In the example above our class was provided without a key which means that the constructor itself is used as the service identifier.

```typescript
container.resolve(MyService);
```

Resolution can also be done by supplying a [resolver](resolvers.md). 

```typescript
container.resolve(Optional.of(MyService));
```

The above code will return _undefined_ instead of throwing an exception if  _MyService_ was not previously registered.

