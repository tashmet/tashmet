import Tashmit from '@tashmit/tashmit';
import HttpServer from '../src';
import {get, post, method} from '../src/decorators';
import express from 'express';
import request from 'supertest-as-promised';
import 'mocha';
import {expect} from 'chai';

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

    @method('get', '/methodGet')
    public async methodGet(req: express.Request, res: express.Response): Promise<any> {
      return {foo: this.foo};
    }

    @post('/post', express.json())
    public async postRoute(req: express.Request, res: express.Response): Promise<any> {
      return req.body;
    }
  }

  const app = new Tashmit()
    .provide(
      TestRouter,
      new HttpServer().router('/route', TestRouter)
    )
    .bootstrap(HttpServer.http);

  it('should add router by resolver', () => {
    return request(app)
      .get('/route')
      .expect(200)
      .then(res => expect(res.body).to.eql({foo: 'bar'}));
  });

  it('should be possible to add routes by method decorator', () => {
    return request(app)
      .get('/route/methodGet')
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
