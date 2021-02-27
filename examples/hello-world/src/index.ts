import {bootstrap, component, memory, Database} from '@ziqquratu/ziqquratu';

@component({
  inject: ['ziqquratu.Database'],
})
export class Application {
  constructor(
    private database: Database,
  ) {}

  async run() {
    const posts = await this.database.createCollection('posts', memory());
    console.log(await posts.insertOne({
      title: 'Hello World!'
    }));
  }
}

bootstrap(Application).then(app => app.run());
