---
description: Tools for working with meta data
---

# Reflection

## Annotation

Meta data is added as annotations which are typically classes extending the Annotation class. This class provides static methods for retrieving the annotation from various parts of a class, be it the constructor, its methods, properties or method parameters.

```typescript
class MyAnnotation extends Annotation {}
```

### Usage

We can now use the annotation class to find instances of the annotation on another class.

```typescript
MyAnnotation.onClass(MyClass)
```

Provided that _MyClass_ has been decorated with _MyAnnotation_ a list of instances will be returned. To also look for the annotation on any base class we need to pass another argument for inheritance and set it to true.

```typescript
MyAnnotation.onClass(MyClass, true);
```

Similar helper methods for finding the annotation on properties, methods or parameters are also available.

## Decoration

In order to annotate any part of a class we need to provide a decorator that applies the annotation.

A list of decorator factories are provided to help you create your own decorators. Each one accepts an annotation factory function as argument.

### Class

Use the **classDecorator** factory to create a decorator for annotating classes.

```typescript
const classDec = () => classDecorator(
  target => new MyAnnotation()
);

@classDec()
class MyClass {}
```

Instances of the annotation can now be retrieved from the class.

```typescript
let annotations = MyAnnotation.onClass(MyClass);
```

The type of class that the decorator can be applied to can also be restricted by supplying a type argument to the factory.

```typescript
const classDec = () => classDecorator<MyClass>(
  target => new MyAnnotation()
);
```

This decorator can now only be applied to classes that are derived from _MyClass._

### Method

Use the **methodDecorator** factory to create a decorator for annotating class methods.

```typescript
const methodDec = () => methodDecorator(
  ({target, propertyKey, descriptor}) => new MyAnnotation()
);

class MyClass {
  @methodDec()
  public foo(input: string): void {}
}
```

Instances of the annotation can now be retrieved from the class.

```typescript
let annotations = MyAnnotation.onClass(MyClass);
```

The signature of the method that the decorator can be applied to can also be restricted by supplying a type argument to the factory.

```typescript
const methodDec = () => methodDecorator<(input: string) => void>(
  ({target, propertyKey, descriptor}) => new MyAnnotation()
);
```

### Property

Use the **propertyDecorator** factory to create a decorator for annotating class properties.

```typescript
const propDec = () => propertyDecorator(
  ({target, propertyKey}) => new MyAnnotation()
);

class MyClass {
  @propDec()
  public foo: string;
}
```

Instances of the annotation can now be retrieved from the class.

```typescript
let annotations = MyAnnotation.onClass(MyClass);
// or
let annotations = MyAnnotation.onProperty(MyClass, 'foo');
```

The type of the property that the decorator can be applied to can also be restricted by supplying a type argument to the factory.

```typescript
const propDec = () => propertyDecorator<string>(
  ({target, propertyKey}) => new MyAnnotation()
);
```

### Parameter

Use the **parameterDecorator** factory to create a decorator for annotating parameters.

```typescript
const paramDec = () => parameterDecorator(
  ({target, propertyKey, parameterIndex}) => new MyAnnotation()
);

class MyClass {
  public foo(@paramDec() input: string) {}
}
```

Instances of the annotation can now be retrieved from the class.

```typescript
let annotations = MyAnnotation.onParameters(MyClass, 'foo');
```

If we want to retrieve parameter annotations from class constructor we just omit the method name.

```typescript
let annotations = MyAnnotation.onParameters(MyClass);
```

