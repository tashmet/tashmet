---
title: File system
description: File system operators
---
# Introduction

Custom operators for working with files

# Usage

## Nabu

When using the Nabu storage engine, File system operators are included by default.

## Memory storage engine

If you are using the memory storage engine the fs plugin must be configured

```typescript
import Memory from '@tashmet/memory';
import mingo from '@tashmet/mingo';
import fs from '@tashmet/fs';

const store = Memory
  .configure({})
  .use(mingo())
  .use(fs())
  .bootstrap();
```

# Expression operators

## $lstat
`{ $lstat: <expression> }`

## $fileExists
`{ $fileExists: <expression> }`

Expression operator that resolves to `true` if the file specified in the expression exists on the file system.

## $readFile
`{ $readFile: <expression> }`

Expression operator that resolves to the content of the file specied in the expression


## $basename
`{ $basename: <path> | [<path>, <suffix>] }`

Expression operator that returns the last portion of a path, similar to the Unix basename command.

See: [https://nodejs.org/api/path.html#pathbasenamepath-suffix](https://nodejs.org/api/path.html#pathbasenamepath-suffix)

## $extname
`{ $basename: <path> }`


See: [https://nodejs.org/api/path.html#pathextnamepath](https://nodejs.org/api/path.html#pathextnamepath)

## $dirname
`{ $dirname: <expression> }`

## $relativePath
`{ $dirname: <expression> }`

## $joinPaths
`{ $joinPaths: <expression> }`

---

# Aggregation stages

## $writeFile

Write each document in the stream to file

```typescript
{
  $writeFile: {
    content: 'content to write (expression or actual data)',
    path: 'path to file',
    overwrite: 'true if file should be overwritten if it exists',
  }
}
```

## $glob
`{ $glob: <expression> }`

## $globMatch
`{ $globMatch: <expression> }`