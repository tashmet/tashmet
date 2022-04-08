---
description: Reading and writing content stored on disk
---

# Nabu

## Introduction

File is a set of tools for reading and writing Tashmet content on disk. It allows us to store collections in files with support for common formats like JSON, YAML or Markdown.

### Installation

```
$ npm install @tashmet/file
```

### Usage

The package exports a component that should be imported as a dependency in your application. It can also optionally be configured to watch for changes to files on disk.

```typescript
@component({
  dependencies: [
    import('@tashmet/file')
  ],
  providers: [
    Provider.ofInstance<FileSystemConfig>('file.FileSystemConfig', {
      watch: true
    })
  ]
})
class Application {}
```

## Collections

### File

This is a collection of documents stored in a single file on disk. The file will contain an object with key-value pairs where the key is the ID of the document and the value its content.

#### Usage

A file-based collection can be created using its factory.

```typescript
database.createCollection('authors', file({
  path: 'content/authors.yaml',
  serializer: yaml()
});
```

The function takes two arguments, a path to the file and a [serializer](./) used for reading and writing the content.

#### Operation

The collection will be populated and and cached in memory as soon as it is created and can be queried like any other collection.

If File was configured to watch for file changes, events will be triggered whenever a user edits the file, adding, removing or updating a document.

### Directory

This is a collection of documents stored in a directory on disk. Each document in the collection will be stored in its own file inside the directory. The name of each file will correspond to the ID of the document it contains.

#### Usage

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

In the example above we create a collection of posts written in markdown with YAML front-matter. The markdown content will be stored in a key called **text** when parsed.

#### Operation

The collection will be populated and cached in memory as soon as it is created and can be queried like any other collection.

If File was configured to watch for file changes, events will be triggered whenever a user adds, removes or edits a document in this directory.

## Serializers

### JSON

### YAML

## Converters

### Markdown
