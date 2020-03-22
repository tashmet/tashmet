---
description: Collection stored in directory
---

# Directory

## Description

This is a collection of documents stored in a directory on disk. Each document in the collection will be stored in its own file inside the directory. The name of each file will correspond to the ID of the document it contains.

## Usage

A directory-based collection can be created using its factory.

```typescript
database.createCollection('posts', directory({
  path: 'content/posts',
  extension: 'md',
  serializer: yaml({
    frontMatter: true,
    contentKey: 'text'
  })
});
```

Like the file-based collection, this configuration needs a path and a serializer. The path should point to a valid directory. A file extension also needs to be provided so that the collection knows how to name new documents that it writes.

In the example above we create a collection of posts written in markdown with YAML front-matter. The markdown content should be stored in a key called **text** when parsed.

### Operation

The collection will be populated and and cached in memory as soon as it is created and can be queried like any other collection.

If Nabu was configured to watch for file changes, events will be triggered whenever a user adds, removes or edits a document in this directory.

