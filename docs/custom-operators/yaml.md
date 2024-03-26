---
title: YAML
description: YAML operators
---

# Introduction

Custom operators for converting YAML

# Usage

## Configuration options

| Option          | Default | Description |
| --------------- | ------------- | ----------- |
| `indent?: number`        | `2` |  Indentation width to use (in spaces) when serializing. |
| `skipInvalid?: boolean`   | `true` | Do not throw on invalid types (like function in the safe schema) and skip pairs and single values with such types.  |
| `flowLevel?: number`     | `-1` | Specifies level of nesting, when to switch from block to flow style for collections. -1 means block style everwhere. |
| `styles?: {[tag: string]: string}`        |  | "tag" => "style" map. Each tag may have own set of styles. |
| `sortKeys?: boolean \| ((a: any, b: any) => number);` | `false` | If true, sort keys when dumping YAML. If a function, use the function to sort the keys. |
| `lineWidth?: number` | 80 | Set max line width for serialized output. |
| `noRefs?: boolean` | false | If true, don't convert duplicate objects into references. |
| `noCompatMode?: boolean` | `false` | If true don't try to be compatible with older yaml versions. Currently: don't quote "yes", "no" and so on, as required for YAML 1.1 |
| `condenseFlow?: boolean;` | `false` | If true flow sequences will be condensed, omitting the space between a, b. Eg. '[a,b]', and omitting the space between key: value and quoting the key. Eg. '{"a":b}'. Can be useful when using yaml for pretty URL query params as spaces are %-encoded. |

## Nabu

When using the Nabu storage engine, the YAML plugin is included by default. If you want to pass configuration options
you can do it like this

```typescript
const store = Nabu
  .configure({
    yaml: { indent: 4 }
  })
  .bootstrap();
```

## Memory storage engine

If you are using the memory storage engine the YAML plugin must be configured

```typescript
import Memory from '@tashmet/memory';
import mingo from '@tashmet/mingo';
import yaml from '@tashmet/yaml';

const store = Memory
  .configure({})
  .use(mingo())
  .use(yaml({ /* configuration options */}))
  .bootstrap();
```

# Operators

## $yamlToObject
`{ $yamlToObject: <expression> }`

Convert a YAML string to an object

```typescript
const data = dedent`
  title: foo
  list:
    - item1
    - item2
`;
const pipeline: Document[] = [
  { $documents: [{ data }] },
  { $set: { data: { $yamlToObject: '$data' } } }
];

const doc = await tashmet.db('test').aggregate(pipeline).next();
```

{% file title="doc" %}
```typescript
{ data: { title: 'foo', list: ['item1', 'item2'] } }
```
{% /file %}

To convert YAML as front matter we need to specify some extra parameters

```typescript
const data = dedent`
  ---
  title: foo
  ---
  Content goes here
`;
const pipeline: Document[] = [
  { $documents: [{ data }] },
  {
    $set: {
      data: {
        $yamlToObject: {
          data: '$data',
          frontMatter: true,
          contentKey: 'body'
        }
      } 
    }
  }
];
const doc = await tashmet.db('test').aggregate(pipeline).next();
```

{% file title="doc" %}
```typescript
{ data: { title: 'foo', body: 'Content goes here' } }
```
{% /file %}

---

## $objectToYaml
`{ $objectToYaml: <expression> }`

Convert an object to a YAML string

```typescript
const input = [
  { data: { foo: 'bar' } }
];
const pipeline: Document[] = [
  { $documents: input },
  { $set: { data: { $objectToYaml: '$data' } } }
];

const doc = await tashmet.db('test').aggregate(pipeline).next();
```