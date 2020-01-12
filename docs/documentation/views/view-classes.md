---
description: The different types of views
---

# View classes

## Item

The most basic type of view is one that monitors a single document.

```typescript
@view({collection: 'posts', monitor: ['_id']})
class SinglePost extends Item {
  @filter() public _id = 'foo';
}
```

The above view will contain a single document where the id matches the one specified in the filter.

{% hint style="info" %}
When a user changes the \_id so that a new document is contained in the view, an **item-updated** event is emitted with the new document from the view.
{% endhint %}

## Range

An item set that limits the range of documents.

The range view allows us to limit the number of documents displayed in the view to a specific range of the result set.

The range is configured by supplying an offset and a optional limit. Here we create a filter that will limit the view to the first 10 matching documents in the collection. Note that omitting the offset in this case would yield the same result.

```typescript
@view({collection: 'posts'})
class MyRange extends Range {
  public offset = 0;
  public limit = 10;
}
```

## Feed

An item set that acts as a feed. 

This item set is suited for where a list of items are shown and the user has the ability to load more. The feed will keep track of how many items should be displayed. The feed is configured by setting an initial limit and an increment by which the limit is increased each time more items are requested.

```typescript
@view({collection: 'posts'})
class MyFeed extends Feed {
  public limit = 10;
  public increment = 5;
}
```

Provided that the collection has enough documents available the above feed will make sure that the view has only 10 documents initially. Calling loadMore\(\) will increase the capacity to 1

```typescript
view.loadMore()
```

