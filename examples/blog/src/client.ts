import {bootstrap, component, Database, Provider, DatabaseConfig, http} from '@ziqquratu/ziqquratu';
import {caching} from '@ziqquratu/caching';

@component({
  providers: [
    Provider.ofInstance<DatabaseConfig>('ziqquratu.DatabaseConfig', {
      collections: {
        'posts': http({path: 'http://localhost:8000/api/posts'})
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
