# Sorting

A view can have multiple sorting properties acting on different keys.

Sorting articles according to their publication date could look as following:

```typescript
class MyView extends View {
  @sortBy('datePublished')
  public dateSort = SortingOrder.Descending;
}
```

