# Filtering

A view can have multiple filters. Each filter will extend the selector object produced by the previous ones.  To filter documents on a certain key we simply create a property with the same name, assign it a value and decorate it with the filter decorator.

```typescript
class MyView extends ItemSet {
  @filter() public category = 'cars';
}
```

Changing the category using the above filter is now trivial

```typescript
view.category = 'bikes';
```

To disable the filter on a specific value we can set the 'disableOn' option.

```typescript
class MyView extends ItemSet {
  @filter({disableOn: 'all'}) public category = 'cars';
}
```

Whenever the user sets category to 'all' the filter will be omitted. If we want to create a more complex filter we can use a compile function to turn our value into a selector.

```typescript
class MyView extends ItemSet {
  @filter({
    compile: value => ({category: {$in: value}}),
  })
  public category = ['cars'];
}
```

