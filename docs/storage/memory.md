---
title: Memory
description: Storing a collection in memory
---

# Introduction

This is the default storage when no storageEngine directive is given.

# Usage

## Create a single memory collection

```typescript
Tashmet.connect(store.proxy()).then(async tashmet => {
  const collection = await tashmet.db('myDb').createCollection('myCollection');
});
```
