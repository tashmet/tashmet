---
title: Array in file
description: Storing a collection as an array within a file
---

# Introduction

This page describes how to set up persistent file storage for a collection using Nabu,
where the documents are stored as an array within a single file.

{% hint style="check" %}
Array in file storage requires the Nabu storage engine
{% /hint %}

# Usage

## Create a single collection

```typescript
Tashmet.connect(store.proxy()).then(async tashmet => {
  const collection = await tashmet.db('myDb').createCollection('myCollection', {
    storageEngine: {
      arrayInFile: {
        path: 'content/myCollection.yaml',
        format: 'yaml'
      }
    }
  });
});
```

The collection stored in `'content/myCollection.yaml'` where each document will reside in a yaml file
that derives its name from the `_id` of the document. 

## Reuse across database

By defining a custom I/O rule for the storage engine, we can reuse the same configuration across multiple collections.

```typescript
const store = Nabu
  .configure({})
  .use(mingo())
  .io('yaml', (ns, options) => ({
    arrayInFile: {
      path: `${ns.db}/${ns.collection}.yaml`,
      format: 'yaml'
    }
  }))
  .bootstrap();

Tashmet.connect(store.proxy()).then(async tashmet => {
  const collection = await tashmet.db('myDb').createCollection('myCollection', {
    storageEngine: 'yaml'
  });
});
```

Alternatively we can set the default I/O rule and skip the `storageEngine` directive entirely.

```typescript
const store = Nabu
  .configure({
    defaultIO: 'yaml'
  })
  // ...

Tashmet.connect(store.proxy()).then(async tashmet => {
  const collection = await tashmet.db('myDb').createCollection('myCollection');
});
```

## Store multiple collections within same file

By specifying a `field` option we can store a complete database within the same file.
In the following example we set up the I/O so that the YAML-file contains an object where keys
correspond to names of collections with values being the list of documents.

```typescript
const store = Nabu
  .configure({})
  .use(mingo())
  .io('yaml', (ns, options) => ({
    arrayInFile: {
      path: `${ns.db}.yaml`,
      format: 'yaml',
      field: ns.collection
    }
  }))
  .bootstrap();
```

Example file output

```yaml
collection1:
  - _id: d1
  - _id: d2
collection2:
  - _id: d1
```

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

## Include array index

`includeArrayIndex?: string`

Include the index of the document within the stored array as a field. 

```typescript
{
  // ...
  includeArrayIndex: 'order'
}
```

{% hint style="check" %}
Note that when using this option as specified above, changing the value of the `order` field will also affect the index of the document within the stored output.
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