# Components

Components allow us to create modular applications.

A basic component is created by applying the component decorator to a class.

```typescript
@component()
class Application {}
```

## Providers

A component typically has one or more [providers](providers.md) that can be injected into each other or into the component itself. A provider can either be an instance of the Provider class created through one of its static factory functions or a class constructor.

```typescript
class Printer {
  public output(message: string) {
    console.log(message);
  }
}

@component({
  providers: [
    Printer,
    Provider.ofInstance('greeting', 'Hello world!')
  ],
  inject: [Printer, 'greeting']
})
class Application {
  constructor(
    private printer: Printer;
    private greeting: string;
  ) {}
  
  public run() {
    this.printer.output(this.greeting);
  }
}
```

Above we have created a component with two providers, one class and one instance \(string\). The component injects both of these into its own constructor.

## Bootstrapping

Once the component has been defined we can bootstrap it.

```typescript
bootstrap(Application).then(app => app.run());
```

The bootstrap function takes the component constructor and returns a promise that resolves to an instance of the component class.

If we wish to dynamically add other providers to the component we can do so by including a function.

```typescript
bootstrap(Application, async container => {
  container.register(Provider.ofInstance('foo', 'bar'));
}).then(app => app.run());
```

The function receives the container as its only argument and we can then use it to register other providers.

{% hint style="warning" %}
Note that providers should only be registered and never resolved in this function.
{% endhint %}

## Dependencies

A component can include other components in order to gain access to their providers.

```typescript
@component()
class MyComponent {}

@component({
  dependencies: [MyComponent]
})
class Application {}
```

If a component class is exported as a default class in a module it can be imported directly into the dependencies list.

```typescript
// mycomponent.ts
@component()
export default class MyComponent {}
```

```typescript
@component({
  dependencies: [import('./mycomponent.ts')]
})
class Application {}
```

