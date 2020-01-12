# Item sets

## Range

An item set that limits the range of documents.

The range view allows us to limit the number of documents displayed in the view to a specific range of the result set.

The range is configured by supplying an offset and a optional limit. Here we create a filter that will limit the view to the first 10 matching documents in the collection. Note that omitting the offset in this case would yield the same result.

```typescript
class MyRange extends Range {
  public offset = 0;
  public limit = 10;
}
```



