---
description: Integration with MongoDB
---

# MongoDB

We can interface with MongoDB collections by wrapping them using this module.

## Installation

```text
$ npm install @ziqquratu/mongodb
```

## Usage

Given a MongoDB collection we can easily create a Ziqquratu collection from it.

```typescript
import {Collection as MongoCollection} from 'mongodb';
import {bootstrap, component, Database} from '@ziqquratu/ziqquratu';
import {mongodb} from '@ziqquratu/mongodb';

let mongoCollection: MongoCollection;
// Connect to mongo db and set up the collection here
// ...

@component({
  inject: ['ziqquratu.Database'],
})
export class Application {
  constructor(
    private database: Database,
  ) {}

  async run() {
    let collection = this.database.createCollection(
      'myCollection', mongodb(mongoCollection)
    );
  }
}

bootstrap(Application).then(app => app.run());
```

