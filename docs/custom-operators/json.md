---
title: JSON
description: JSON operators
---

# Introduction

Custom operators for converting JSON

# Usage

## Nabu

When using the Nabu storage engine, JSON operators are included by default.

## Memory storage engine

If you are using the memory storage engine the JSON plugin must be configured

```typescript
import Memory from '@tashmet/memory';
import mingo from '@tashmet/mingo';
import json from '@tashmet/json';

const store = Memory
  .configure({})
  .use(mingo())
  .use(json())
  .bootstrap();
```

# Operators

## $jsonToObject
`{ $jsonToObject: <expression> }`

Convert a JSON string to an object

```typescript
const input = [
  { json: '{ "foo": "bar" }' }
];
const pipeline: Document[] = [
  { $documents: input },
  { $set: { object: { $jsonToObject: '$json' } } }
];

const doc = await tashmet.db('test').aggregate(pipeline).next();
```

## $objectToJson
`{ $objectToJson: <expression> }`

Convert an object to a JSON string

```typescript
const input = [
  { object: { foo: 'bar' } }
];
const pipeline: Document[] = [
  { $documents: input },
  { $set: { json: { $objectToJson: '$object' } } }
];

const doc = await tashmet.db('test').aggregate(pipeline).next();
```