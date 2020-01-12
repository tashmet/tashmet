---
description: An collection of documents stored in memory
---

# Memory

This built-in collection stores documents in memory. Internally it uses [mingo](https://github.com/kofrasa/mingo) which is a lightweight implementation of the mongoDB query language.

```typescript
database.createCollection('posts', memory())
```

