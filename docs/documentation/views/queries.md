# Queries

## Stored queries

Usually when we want to retrieve a set of documents from a collection we do it based on some state in our application. Take for instance a blog where we want to display a certain amount of posts of a given category sorted by publishing date. It would be natural to represent this state like follows.

```typescript
interface PostFilter {
  limit: number;
  category: string;
  dateSort: SortingDirection;
}
```

A stored query allows us to define a class implementing this interface where the properties have been decorated in a way that the class can act as a query.

```typescript
class PostQuery implements PostFilter {
  limit = 10;
  
  @filter({
    compile: value => ({category: {$contains: value}}),
  })
  category = 'cars';
  
  @sortBy('datePublished')
  dateSort = SortingDirection.Descending;
}
```

### Creating a cursor

The query can now be turned into a cursor using the **makeCursor** function. This function takes an instance of the query and the collection it should be applied to and returns a cursor ready to be used.

```typescript
const docs = makeCursor(new PostQuery(), posts).toArray();
```



