# Queries

## Query

```typescript
interface PostFilter {
  limit: number;
  category: string;
  dateSort: SortingOrder;
}

class PostQuery extends Query implements PostFilter {
  limit = 10;
  
  @filter({
    compile: value => ({category: {$contains: value}}),
  })
  category = 'cars';
  
  @sortBy('datePublished')
  dateSort = SortingOrder.Descending;
}

let q = new MyQuery(posts);
let docs = q.cursor.toArray();
```

