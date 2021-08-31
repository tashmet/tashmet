---
description: Building aggregation pipelines from application state
---

# Aggregation

Usually when we want to retrieve a set of documents from a collection we do it based on some state in our application. Take for instance a blog where we want to display a certain amount of posts of a given category sorted by publishing date. It would be natural to represent this state as follows.

```typescript
class PostFilter {
  limit: number = 0;
  category: string | undefined;
  dateSort: SortingDirection = SortingDirection.Ascending;
}
```

The most basic solution is an interface that allows us to turn this state into an aggregation pipeline.

```typescript
class PostFilter implements AggregationBuilder {
  limit: number = 0;
  category: string;
  dateSort: SortingDirection = SortingDirection.Ascending;

  toPipeline() {
    return [
      {$match: {category: this.category}},
      {$sort: {datePublished: this.dateSort}},
      {$limit: this.limit},
    ];
  }
}
```

