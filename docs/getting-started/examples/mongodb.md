---
description: Integration with MongoDB
---

# MongoDB

We can interface with MongoDB collections by wrapping them using this module.

## Installation

```text
$ npm install @tashmet/mongodb
```

## Usage

Given a MongoDB collection we can easily create a Tashmet collection from it.

```typescript
import {Collection as MongoCollection} from 'mongodb';
import {bootstrap, component, Database} from '@tashmet/tashmet';
import {mongodb} from '@tashmet/mongodb';

let mongoCollection: MongoCollection;
// Connect to mongo db and set up the collection here
// ...

@component({
  inject: [Database],
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

