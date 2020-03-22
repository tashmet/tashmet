import {bootstrap, component, Provider} from '@ziqquratu/ziqquratu';
import {Server} from '../src/interfaces';
import {get, post} from '../src/decorators';
import {ServerConfig} from '../src/interfaces';
import Tashmetu from '../src/index';
import express from 'express';
import bodyParser from 'body-parser';
import request from 'supertest-as-promised';
import 'mocha';
import {expect} from 'chai';
import {router} from '../src/controller';

describe('Router', () => {
  class TestRouter {
    private foo: string;

    public constructor() {
      this.foo = 'bar';
    }

    @get('/')
    public async route(req: express.Request, res: express.Response): Promise<any> {
      return {foo: this.foo};
    }

    @post('/post', bodyParser.json())
    public async postRoute(req: express.Request, res: express.Response): Promise<any> {
      return req.body;
    }
  }

  @component({
    providers: [
      TestRouter,
      Provider.ofInstance<ServerConfig>('tashmetu.ServerConfig', {
        middleware: {
          '/route': router(TestRouter),
        }
      })
    ],
    dependencies: [Tashmetu],
    inject: ['tashmetu.Server']
  })
  class TestComponent {
    constructor(
      public server: Server
    ) {}
  }

  let app: Server;

  before(async () => {
    app = (await bootstrap(TestComponent)).server;
  });

  it('should add router by resolver', () => {
    return request(app)
      .get('/route')
      .expect(200)
      .then(res => expect(res.body).to.eql({foo: 'bar'}));
  });

  it('should post to router and recieve reply', () => {
    return request(app)
      .post('/route/post')
      .send({foo: 'bar'})
      .expect(200)
      .then(res => expect(res.body).to.eql({foo: 'bar'}));
  });
});
