import {bootstrap, component, Database} from '@ziqquratu/ziqquratu';
import {caching} from '@ziqquratu/caching';
import {rest} from '@ziqquratu/rest';
import operators from '@ziqquratu/operators/basic';

@component({
  providers: [
    Database.configuration({
      operators,
      collections: {
        'posts': rest({path: 'http://localhost:8000/api/posts'})
      },
      use: [caching()],
    }),
  ],
  inject: [Database],
})
export class Application {
  constructor(private database: Database) {}

  async run() {
    const posts = await this.database.collection('posts');
    const docs = await posts.find().toArray();
    console.log(docs);
  }
}

bootstrap(Application).then(app => app.run());
