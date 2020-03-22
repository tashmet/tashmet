---
description: Collection stored in a single file
---

# File

## Description

This is a collection of documents stored in a single file on disk. The file will contain an object with key-value pairs where the key is the ID of the document and the value its content.

## Usage

A file-based collection can be created using its factory.

```typescript
database.createCollection('authors', file({
  path: 'content/authors.yaml',
  serializer: yaml()
});
```

The function takes two arguments, a path to the file and a [serializer](../serializers/) used for reading and writing the content.

### Operation

The collection will be populated and and cached in memory as soon as it is created and can be queried like any other collection.

If Nabu was configured to watch for file changes, events will be triggered whenever a user edits the file, adding, removing or updating a document.

