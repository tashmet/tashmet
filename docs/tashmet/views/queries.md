---
description: Building aggregations with decorators
---

# Queries

## Decorated queries

In the previous section we saw how application state could be turned into an aggregation pipeline. Let's employ some helpful decorators that let us do this in a declarative way. 

The **QueryBuilder** class is an implementation of the **AggregationBuilder** that is useful when we simply want to retrieve a sub-set of documents from a collection, ie without transformation steps. It provides its own **toPipeline** method that creates a pipeline for us based on the hints we give it by decorating our properties.

```typescript
class PostQuery extends QueryBuilder {
  @Op.limit limit = 10;
  
  @Op.$eq('category')
  category = 'cars';
  
  @Op.sort('datePublished')
  dateSort = SortingDirection.Descending;
}
```



