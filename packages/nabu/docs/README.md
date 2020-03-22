# Introduction

## Description

Nabu is a set of tools for reading and writing Ziqquratu content on disk. It allows us to store collections in files with support for common formats like JSON, YAML or Markdown.

## Installation

```text
$ npm install @ziqquratu/nabu
```

## Usage

The package exports a component that should be imported as a dependency in your application. It can also optionally be configured to watch for changes to files on disk.

```typescript
@component({
  dependencies: [
    import('@ziqquratu/nabu')
  ],
  providers: [
    Provider.ofInstance<FileSystemConfig>('nabu.FileSystemConfig', {
      watch: true
    })
  ]
})
class Application {}
```

