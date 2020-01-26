---
description: Monitor one or more documents in a collection
---

# Views

Views allow us to track a subset of documents in a collection by applying various filters.

## Installation

```text
npm install @ziqquratu/view
```

## Defining a view

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

## Usage

Once a view is defined and provided we can inject and use it in another class and consume the documents it contains. To fetch the documents into the view it first needs to be refreshed.

```typescript
@provider({
  inject: [MyView]
})
class ViewConsumer {
  public constructor(private view: MyView) {}

  public async render() {
    await this.view.refresh();
    console.log(this.view.data);
  }
}
```

### Monitoring changes

A view can have multiple properties that define which documents should be included \([filtering](filtering.md)\) and how they should be ordered \([sorting](sorting.md)\). These properties can be monitored so that a change automatically refreshes the data.

```typescript
@view({collection: 'posts', monitor: ['dateSort']})
class MyView extends ItemSet {
  @sortBy('datePublished')
  public dateSort = SortingOrder.Ascending;
}
```

In the above example a sorting property was added to the view. This will sort the documents on the _datePublished_ key in ascending order. By specifying the _dateSort_ property to be monitored we make sure that the view is refreshed as soon as the sorting order has been changed.

```typescript
view.on('item-set-updated', docs => {
  // docs here will now be sorted in descending order.
});

view.dateSort = SortingOrder.Descending;
```

