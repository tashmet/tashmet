---
title: Glob
description: Storing a collection in multiple files matching a glob pattern
---

# Introduction

This page describes how to set up persistent file storage for a collection using Nabu,
where each document is stored within a file under multiple directories on the file system

{% hint style="check" %}
Glob storage requires the Nabu storage engine
{% /hint %}

# Usage

## Create a single glob collection

```typescript
Tashmet.connect(store.proxy()).then(async tashmet => {
  const collection = await tashmet.db('myDb').createCollection('myCollection', {
    storageEngine: {
      glob: {
        pattern: 'content/myCollection/**/*.yaml',
        format: 'yaml'
      }
    }
  });
});
```

The collection stored in `'content/myCollection/**/*.yaml'` where each document will reside in a yaml file
that derives its name from the `_id` of the document. 

## Reuse across database

By defining a custom I/O rule for the storage engine, we can reuse the same configuration across multiple collections.

```typescript
const store = Nabu
  .configure({})
  .use(mingo())
  .io('yaml', (ns, options) => ({
    glob: {
      pattern: `${ns.db}/${ns.collection}/**/*.yaml`,
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

---

# Parameters

## Pattern
`pattern: string`

Pattern matching files that should be included in the collection

## Format 
`format: string | Document`

File format. The current valid file formats include:

* `format: 'json'`
* `format: 'yaml'`

If we want to access YAML front matter, `format` also accepts the following configuration.

```typescript
// YAML with front matter
{
  // ...
  format: {
    yaml: {
      frontMatter: true,
      contentKey: 'content' 
    }
  }
}
```

## Merge stat

`mergeStat?: Document`

Include file information for each document when it's loaded from the file system.
Expressions in `merge` are computed against the underlying file information (lstat).
Consider the following example for how to include the path of the file.

```typescript
// Include file path
{
  // ...
  mergeStat: {
    path: '$path'
  }
}
```

The following fields are available for merging:

`path, dev, mode, nlink, uid, gid, rdev, blksize, ino, size, blocks, atimeMs, mtimeMs, ctimeMs, birthtimeMs,
atime, mtime, ctime, birthtime`

{% hint style="check" %}
Any fields defined in the merge will be pruned before writing them to disk
{% /hint %}


## Construct

`construct?: Document`

Add additional fields to the document. This stage is performed after `merge` is completed.
Expressions in `construct` are computed against the actual, loaded document.

Consider the following example where we read markdown files with YAML front matter.
The markdown content will be stored under a field named `markdown` and we use `construct`
to add an additional field `html` that contains the converted output.

```typescript
{
  pattern: '/content/**/*.md',
  format: {
    yaml: {
      frontMatter: true,
      contentKey: 'markdown'
    }
  },
  construct: {
    html: {
      $markdownToHtml: '$markdown'
    }
  }
}
```

{% hint style="check" %}
Any fields defined in the `construct` stage will be pruned before writing them to disk
{% /hint %}
