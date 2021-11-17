import Tashmit from '@tashmit/tashmit';
import {QueryParser} from '@tashmit/qs-parser';
import HttpServer from '../src';
import request from 'supertest-as-promised';
import 'mocha';
import {expect} from 'chai';
import operators from '@tashmit/operators/system';

describe('Resource', () => {
  const app = Tashmit
    .withConfiguration({
      operators,
    })
    .collection('test', [{_id: 'doc1'}, {_id: 'doc2'}])
    .provide(
      new HttpServer({queryParser: QueryParser.flat()})
        .resource('/readonly', {collection: 'test', readOnly: true})
        .resource('/readwrite', {collection: 'test', readOnly: false})
    )
    .bootstrap(HttpServer.http);

  describe('get', () => {
    it('should get all documents', () => {
      return request(app)
        .get('/readonly')
        .expect(200)
        .then(res => expect(res.body).to.eql([{_id: 'doc1'}, {_id: 'doc2'}]));
    });

    it('should get a single document by id', () => {
      return request(app)
        .get('/readonly/doc1')
        .expect(200)
        .then(res => expect(res.body).to.eql({_id: 'doc1'}));
    });

    it('should filter documents', () => {
      return request(app)
        .get('/readonly?_id=doc2')
        .expect(200)
        .then(res => expect(res.body).to.eql([{_id: 'doc2'}]));
    });

    it('should return error when document not found', () => {
      return request(app)
        .get('/readonly/doc3')
        .expect(404);
    });
  });

  describe('post', () => {
    it('should fail on read only resource', () => {
      return request(app).post('/readonly').expect(403);
    });

    it('should create and return document', () => {
      return request(app)
        .post('/readwrite')
        .send({_id: 'doc3'})
        .expect(201)
        .then(res => expect(res.body).to.eql({acknowledged: true, insertedId: 'doc3'}));
    });

    it('should have added document to collection', () => {
      return request(app)
        .get('/readwrite/doc3')
        .expect(200)
        .then(res => expect(res.body).to.eql({_id: 'doc3'}));
    });
  });

  describe('put', () => {
    it('should fail on read only resource', () => {
      return request(app).put('/readonly/doc1').expect(403);
    });

    it('should update and return document', () => {
      return request(app)
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
      return request(app)
        .get('/readwrite/doc3')
        .expect(200)
        .then(res => expect(res.body).to.eql({_id: 'doc3', foo: 'bar'}));
    });
  });

  describe('delete', () => {
    it('should fail on read only resource', () => {
      return request(app).delete('/readonly/doc1').expect(403);
    });

    it('should fail when document does not exist ', () => {
      return request(app)
        .delete('/readwrite/doc4')
        .expect(204);
    });

    it('should delete and return status', () => {
      return request(app)
        .delete('/readwrite/doc3')
        .expect(200)
        .then(res => expect(res.body).to.eql({acknowledged: true, deletedCount: 1}));
    });

    it('should have modified the collection', () => {
      return request(app)
        .get('/readwrite/doc3')
        .expect(404);
    });
  });
});
