# Creating an application

## Installation

In your project, use npm to install the package.

```
$ npm install @ziggurat/ziggurat
```

## Your first application

In the following example we will set up a an application, create a collection and insert a document into it.

```typescript
import {bootstrap, component} from '@ziggurat/tiamat';
import {Database, memory} from '@ziggurat/ziggurat';

@component({
  dependencies: [import('@ziggurat/ziggurat')],
  inject: ['ziggurat.Database'],
})
export class Application {
  constructor(
    private database: Database,
  ) {}

  async run() {
    let posts = this.database.createCollection('posts', memory());
    console.log(await posts.upsert({
      title: 'Hello World!'
    }));
  }
}

bootstrap(Application).then(app => app.run());
```

The foundation for creating applications can be found in the companion library [Tiamat](https://ziggurat.gitbook.io/tiamat/). This library allows us to make applications that are modular through dependency injection.

In the example we defined a component with a dependency on Ziggurat which will give us access to its database. When we bootstrap our component the database is injected into its constructor and we can use it to create a collection and insert a document.

