import Tashmet, {provider} from '@tashmet/tashmet';
import Memory from '@tashmet/memory';
import {QueryParser} from '@tashmet/qs-parser';
import HttpServer from '../src';
import request from 'supertest-as-promised';
import 'mocha';
import {expect} from 'chai';
import 'mingo/init/system';

describe.skip('Resource', () => {

  let server: any;

  @provider()
  class TestResourceApp {
    public constructor(private tashmet: Tashmet, private server: HttpServer) {}

    public async setup() {
      const collection = this.tashmet.db('test').collection('test')

      await collection.insertMany([{_id: 'doc1'}, {_id: 'doc2'}]);

      this.server
        .resource('/readonly', {collection, readOnly: true})
        .resource('/readonly', {collection, readOnly: false});

      return this.server.http;
    }
  }

  before(async () => {
    const app = await Tashmet
      .configure()
      .use(Memory, {})
      .use(HttpServer, {queryParser: QueryParser.flat()})
      .bootstrap(TestResourceApp);

    server = await app.setup();
  });

  describe('get', () => {
    it('should get all documents', () => {
      return request(server)
        .get('/readonly')
        .expect(200)
        .then(res => expect(res.body).to.eql([{_id: 'doc1'}, {_id: 'doc2'}]));
    });

    it('should get a single document by id', () => {
      return request(server)
        .get('/readonly/doc1')
        .expect(200)
        .then(res => expect(res.body).to.eql({_id: 'doc1'}));
    });

    it('should filter documents', () => {
      return request(server)
        .get('/readonly?_id=doc2')
        .expect(200)
        .then(res => expect(res.body).to.eql([{_id: 'doc2'}]));
    });

    it('should return error when document not found', () => {
      return request(server)
        .get('/readonly/doc3')
        .expect(404);
    });
  });

  describe('post', () => {
    it('should fail on read only resource', () => {
      return request(server).post('/readonly').expect(403);
    });

    it('should create and return document', () => {
      return request(server)
        .post('/readwrite')
        .send({_id: 'doc3'})
        .expect(201)
        .then(res => expect(res.body).to.eql({acknowledged: true, insertedId: 'doc3'}));
    });

    it('should have added document to collection', () => {
      return request(server)
        .get('/readwrite/doc3')
        .expect(200)
        .then(res => expect(res.body).to.eql({_id: 'doc3'}));
    });
  });

  describe('put', () => {
    it('should fail on read only resource', () => {
      return request(server).put('/readonly/doc1').expect(403);
    });

    it('should update and return document', () => {
      return request(server)
        .put('/readwrite/doc3')
        .send({_id: 'doc3', foo: 'bar'})
        .expect(200)
        .then(res => expect(res.body).to.eql({
          acknowledged: true,
          matchedCount: 1,
          modifiedCount: 1,
          upsertedCount: 0,
        }));
    });

    it('should have updated document in collection', () => {
      return request(server)
        .get('/readwrite/doc3')
        .expect(200)
        .then(res => expect(res.body).to.eql({_id: 'doc3', foo: 'bar'}));
    });
  });

  describe('delete', () => {
    it('should fail on read only resource', () => {
      return request(server).delete('/readonly/doc1').expect(403);
    });

    it('should fail when document does not exist ', () => {
      return request(server)
        .delete('/readwrite/doc4')
        .expect(204);
    });

    it('should delete and return status', () => {
      return request(server)
        .delete('/readwrite/doc3')
        .expect(200)
        .then(res => expect(res.body).to.eql({acknowledged: true, deletedCount: 1}));
    });

    it('should have modified the collection', () => {
      return request(server)
        .get('/readwrite/doc3')
        .expect(404);
    });
  });
});
