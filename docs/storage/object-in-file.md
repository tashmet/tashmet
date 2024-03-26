---
title: Object in file
description: Storing a collection as an object within a file
---

# Introduction

This page describes how to set up persistent file storage for a collection using Nabu,
where the documents are stored as an object within a single file with the ID as key
and the rest of the document as value

{% hint style="check" %}
Object in file storage requires the Nabu storage engine
{% /hint %}

# Usage

## Per collection using storage engine option

To configure a single collection to be stored as an object in file we can specify
the `storageEngine` option when creating the collection.

```typescript
const store = Nabu
  .configure({})
  .use(mingo())
  .bootstrap();

Tashmet.connect(store.proxy()).then(async tashmet => {
  const collection = await tashmet.db('myDb').createCollection('myCollection', {
    storageEngine: {
      objectInFile: {
        path: 'content/myCollection.yaml',
        format: 'yaml'
      }
    }
  });
});
```

Insert a couple of documents

```typescript
await collection.insertMany([
  { _id: 'doc1', title: 'foo' },
  { _id: 'doc2', title: 'bar' },
];
```

After the insert operation above `content/myCollection.yaml` will contain the following:

{% file title="content/myCollection.yaml" %}
```yaml
doc1:
  title: foo
doc2:
  title: bar
```
{% /file %}


## Reuse across database

By defining a custom I/O rule for the storage engine, we can reuse the same configuration across multiple collections. Here we create a rule called `objectInYaml` that we can target when creating the collection.

```typescript
const store = Nabu
  .configure({})
  .use(mingo())
  .io('objectInYaml', (ns, options) => ({
    objectInFile: {
      path: `${ns.db}/${ns.collection}.yaml`,
      format: 'yaml'
    }
  }))
  .bootstrap();

Tashmet.connect(store.proxy()).then(async tashmet => {
  const collection = await tashmet.db('myDb').createCollection('myCollection', {
    storageEngine: 'objectInYaml'
  });
});
```

Alternatively we can set the default I/O rule and skip the `storageEngine` option entirely.

```typescript
const store = Nabu
  .configure({
    defaultIO: 'objectInYaml'
  })
  // ...

Tashmet.connect(store.proxy()).then(async tashmet => {
  const collection = await tashmet.db('myDb').createCollection('myCollection');
});
```

## Store multiple collections within same file

By specifying a `field` option we can store a complete database within the same file.
In the following example we set up the I/O so that the YAML-file contains an object where keys correspond to names of collections.

```typescript
const store = Nabu
  .configure({
    defaultIO: 'dbInYaml'
  })
  .use(mingo())
  .io('dbInYaml', (ns, options) => ({
    objectInFile: {
      path: `${ns.db}.yaml`,
      format: 'yaml',
      field: ns.collection
    }
  }))
  .bootstrap();

  Tashmet.connect(store.proxy()).then(async tashmet => {
    const collection = await tashmet.db('myDb').createCollection('myCollection');
    await collection.insertMany([
      { _id: 'doc1', title: 'foo' },
      { _id: 'doc2', title: 'bar' },
    ];
  });

```

Content on disk

{% file title="myDb.yaml" %}
```yaml
myCollection:
  doc1:
    title: foo
  doc2:
    title: bar
```
{% /file %}

---

# Parameters

## Path 
`path: string`

Path to the file where documents are stored

## Format 
`format: string`

File format. The current valid file formats include:

* `format: 'json'`
* `format: 'yaml'`

## Field

`field?: string`

An optional name of the field under which the documents are stored in the file. When omitted the list of documents are stored at the root

{% hint style="check" %}
Note that `field` supports nesting, eg: `'foo.bar'` is valid
{% /hint %}

## Input

`input?: Document[]`

Optional additional pipeline stages to apply after documents have been read from file.

{% hint style="check" %}
When using this option, make sure that `output` is also present and does the inverse transformation of `input.
{% /hint %}

## Output

`output?: Document[]`

Optional additional pipeline stages to apply before documents are written to file.

{% hint style="check" %}
When using this option, make sure that `input` is also present and does the inverse transformation of `output`.
{% /hint %}