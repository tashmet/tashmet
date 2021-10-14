# Creating an application

## Installation

In your project, use npm to install the package.

```text
$ npm install @tashmit/tashmit
```

## Your first application

In the following example we will set up a an application, create a collection and insert a document into it.

```typescript
import {bootstrap, component, memory, Database} from '@tashmit/tashmit';

@component({
  inject: [Database],
})
export class Application {
  constructor(
    private database: Database,
  ) {}

  async run() {
    let posts = await this.database.createCollection('posts', memory());
    console.log(await posts.insertOne({
      title: 'Hello World!'
    }));
  }
}

bootstrap(Application).then(app => app.run());
```

The application is defined as a [component](../tashmit/core/ioc/components.md). When we bootstrap it the database is injected into its constructor and we can use it to create a collection and insert a document.

