# Factories

At its core a factory is simply a class extending the built-in Factory class, with a create method accepting input arguments and returning instances.

```typescript
class MyFactory extends Factory<string> {
  public create(input: string) {
    return 'output from ' + input;
  }
}
```

Not be confused with the [factory provider](providers.md#factory) those purpose is to resolve instances from the container by injecting dependencies into a function, this type of factory can instead be instantiated outside of the container and be called on to create instances by the user rather than by the container.

A factory does however have access to the container for resolving dependencies once it has been registered on a component.

```typescript
@component({
  providers: [Provider.ofInstance('foo', 'bar')],
  factories: [MyFactory]
})
class Application {}
```

Now we have the ability to resolve the provided instance inside the factory

```typescript
class MyFactory extends Factory<string> {
  public constructor() {
    super('foo');
  }

  public create(input: string) {
    return this.resolve((foo: string) => {
      return 'output from ' + input ' with ' + foo;
    });
  }
}
```
