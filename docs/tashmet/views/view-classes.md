# Views

Just like queries, views are defined as a class with decorated properties. Unlike a query though, a view additionally allows us to track the documents that are produced by it. Therefore a view needs to be associated with a collection when it is created and also needs to extend one of several available base classed depending on the kind of view we want to work with.

## Defining a view

A view is defined as a class extending one of the view classes and annotated by the view decorator. Here we define a view that should track a set of documents in a collection named 'posts'.

```typescript
@view({collection: 'posts'})
class Posts extends ItemSet {}
```

Once the class is decorated it can be added to the providers of a component and injected into a consuming class.

```typescript
@component({
  providers: [Posts]
})
class Application {}
```

## Usage

Once a view is defined and provided we can inject and use it in another class and consume the documents it contains. To fetch the documents into the view it first needs to be refreshed.

```typescript
@provider({
  inject: [Posts]
})
class ViewConsumer {
  public constructor(private view: Posts) {}

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
class Posts extends ItemSet {
  @sortBy('datePublished')
  public dateSort = SortingDirection.Ascending;
}
```

In the above example a sorting property was added to the view. This will sort the documents on the _datePublished_ key in ascending order. By specifying the _dateSort_ property to be monitored we make sure that the view is refreshed as soon as the sorting order has been changed.

```typescript
view.on('item-set-updated', docs => {
  // docs here will now be sorted in descending order.
});

view.dateSort = SortingDirection.Descending;
```

## Base classes

### Item

A view that monitors a single document.

```typescript
@view({collection: 'posts', monitor: ['_id']})
class SinglePost extends Item {
  @filter() public _id = 'foo';
}
```

The above view will contain a single document where the id matches the one specified in the filter

{% hint style="info" %}
When a user changes the \_id so that a new document is contained in the view, an **item-updated** event is emitted with the new document from the view.
{% endhint %}

### ItemSet

A view that monitors a subset of documents.

```typescript
@view({collection: 'posts', monitor: ['dateSort']})
class Posts extends ItemSet {
  @sortBy('datePublished')
  public dateSort = SortingOrder.Descending;
}
```

The above view will contain every document in the collection sorted by _datePublished_ in descending order.

{% hint style="info" %}
When a user changes the sorting order or a document is upserted to or removed from the collection, an **item-set-updated** event is emitted with the new documents now contained in the view.
{% endhint %}

### Feed

An item set that acts as a feed.

This item set is suited for where a list of items are shown and the user has the ability to load more. The feed will keep track of how many items should be displayed. The feed is configured by setting an initial limit and an increment by which the limit is increased each time more items are requested.

```typescript
@view({collection: 'posts'})
class PostFeed extends Feed {
  public limit = 10;
  public increment = 5;
}
```

Provided that the collection has enough documents available the above feed will make sure that the view has only 10 documents initially. Calling **loadMore** will increase the capacity to 15.

```typescript
view.loadMore()
```

