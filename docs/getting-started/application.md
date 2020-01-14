# Creating an application

## Your first application

In the following example we will set up a database with a single in-memory collection with a couple of initial documents in it.

```typescript
import {bootstrap, component, Provider} from '@ziggurat/tiamat';
import {Database, Collection} from '@ziggurat/ziggurat';

@component({
  dependencies: [
    import('@ziggurat/ziggurat')
  ],
  providers: [
    Provider.ofInstance<Database>('ziggurat.DatabaseConfig', {
      collections: {
        'posts': memory([
          {name: 'doc1'},
          {name: 'doc2'},
        ])
      }
    }),
  ],
  inject: ['ziggurat.Database'],
})
export class Application {
  constructor(
    private database: Database,
  ) {}

  async run() {
    const posts = await this.database.collection('posts').find()
    console.log(posts);
  }
}

bootstrap(Application).then(app => app.run()));
```



