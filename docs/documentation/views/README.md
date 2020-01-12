---
description: Monitor one or more documents in a collection
---

# Views

Views allow us to track a subset of documents in a collection by applying various filters.

A view is defined as a class extending one of the [view classes](view-classes.md) and annotated by the view decorator.

```typescript
@view({collection: 'posts'})
class MyView extends ItemSet {}
```

Once the class is decorated it can be added to the providers of a component and injected into a consuming class.

```typescript
@component({
  providers: [MyView]
})
class Application {}
```



