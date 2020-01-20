# Creating an application

## Your first application

In the following example we will set up a database with a single in-memory collection with a couple of initial documents in it.

```typescript
import {bootstrap, component, Provider} from '@ziqquratu/tiamat';
import {Database, Collection} from '@ziqquratu/ziqquratu';

@component({
  dependencies: [
    import('@ziqquratu/ziqquratu')
  ],
  providers: [
    Provider.ofInstance<Database>('ziqquratu.DatabaseConfig', {
      collections: {
        'posts': memory([
          {name: 'doc1'},
          {name: 'doc2'},
        ])
      }
    }),
  ],
  inject: ['ziqquratu.Database'],
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



