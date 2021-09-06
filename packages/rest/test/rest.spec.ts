import {component, Database} from '@ziqquratu/ziqquratu';
import {rest} from '../src';
import {expect} from 'chai';
import 'mocha';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import fetchMock from 'fetch-mock';
import {Collection, QueryOptions} from '../../database/dist';
import { bootstrap } from '@ziqquratu/core';

chai.use(require('chai-fetch-mock'));
chai.use(chaiAsPromised);

function uri(path: string, selector: object, options?: QueryOptions) {
  const s = encodeURIComponent(JSON.stringify(selector));

  let out = `${path}?selector=${s}`;
  if (options) {
    if (options.sort) {
      out = out + '&sort=' + encodeURIComponent(JSON.stringify(options));
    }
    if (options.skip) {
      out = out + '&skip=' + options.skip.toString();
    }
    if (options.limit) {
      out = out + '&limit=' + options.limit.toString();
    }
  }
  return out;
}

function matchBody(body: any) {
  return (url: string, opts: any) => opts.body === JSON.stringify(body);
}

describe('RestCollection', () => {
  @component({
    providers: [
      Database.configuration({
        collections: {
          'test': rest({path: '/api/test'}),
        }
      })
    ],
    inject: [Database]
  })
  class TestComponent {
    constructor(public database: Database) {}
  }

  let col: Collection;

  before(async () => {
    const database = (await bootstrap(TestComponent)).database;
    col = await database.collection('test');

    fetchMock.head(uri('/api/test', {_id: 'foo'}), {
      headers: {'x-total-count': '1'}
    });
    fetchMock.get(uri('/api/test', {_id: 'foo'}), {
      body: {_id: 'foo'},
      headers: {'x-total-count': '1'}
    });
    fetchMock.head('*', {headers: {'x-total-count': '0'}});
  });

  after(() => {
    fetchMock.restore();
  });

  describe('count', () => {
    it('should get count from "x-total-count" header', async () => {
      return expect(col.find({_id: 'foo'}).count()).to.eventually.eql(1);
    });
  });

  describe('insertOne', () => {
    before(() => {
      fetchMock.post(matchBody({_id: 'bar'}), {body: {_id: 'bar', server: 'added'}});
      fetchMock.post(matchBody({_id: 'foo'}), {throws: new Error('ID already exists')});
      fetchMock.post(matchBody({_id: 'error'}), {status: 500, body: ''});
      fetchMock.put('/api/test/foo', {body: {_id: 'foo', server: 'updated'}});
    });

    after(() => {
      fetchMock.restore();
    });

    it('should POST if document does not exist on server', async () => {
      return expect(col.insertOne({_id: 'bar'})).to.eventually.eql({_id: 'bar', server: 'added'});
    });
    it('should throw if document already exists on server', () => {
      return expect(col.insertOne({_id: 'foo'}))
        .to.eventually.be.rejectedWith('ID already exists');
    });
    it('should throw if there is an error in the server', () => {
      return expect(col.insertOne({_id: 'error'}))
        .to.eventually.be.rejectedWith('Internal Server Error');
    });
  });

  describe('replaceOne', () => {
    before(() => {
      fetchMock.get(uri('/api/test', {_id: 'foo'}, {limit: 1}), {body: [{_id: 'foo'}]});
      fetchMock.get(uri('/api/test', {_id: 'bar'}, {limit: 1}), {body: []});
      fetchMock.post(matchBody({_id: 'bar'}), {body: {_id: 'bar', server: 'added'}});
      fetchMock.put('/api/test/foo', {body: {_id: 'foo', server: 'updated'}});
    });

    after(() => {
      fetchMock.restore();
    });

    it('should PUT if document exists on server', async () => {
      return expect(col.replaceOne({_id: 'foo'}, {}))
        .to.eventually.eql({_id: 'foo', server: 'updated'});
    });
    it('should return null if no document matched selector', async () => {
      return expect(col.replaceOne({_id: 'bar'}, {})).to.eventually.eql(null);
    });
    it('should post when upsert is specified', async () => {
      return expect(col.replaceOne({_id: 'bar'}, {_id: 'bar'}, {upsert: true}))
        .to.eventually.eql({_id: 'bar', server: 'added'});
    });
  });

  describe('delete', () => {
    before(() => {
      fetchMock.get(uri('/api/test', {_id: 'foo'}, {limit: 1}), {body: [{_id: 'foo'}]});
      fetchMock.get(uri('/api/test', {_id: 'foo'}), {body: [{_id: 'foo'}]});
      fetchMock.delete('/api/test/foo', {status: 204});
      fetchMock.get(uri('/api/test', {_id: 'bar'}, {limit: 1}), {body: []});
      fetchMock.get(uri('/api/test', {_id: 'bar'}), {body: []});
    });

    describe('deleteOne', () => {
      it('should return null when no document match selector', async () => {
        return expect(col.deleteOne({_id: 'bar'})).to.eventually.eql(null);
      });
      it('should return the deleted document', async () => {
        return expect(col.deleteOne({_id: 'foo'})).to.eventually.eql({_id: 'foo'});
      });
    });

    describe('deleteMany', () => {
      it('should return empty list when no documents match selector', async () => {
        return expect(col.deleteMany({_id: 'bar'})).to.eventually.eql([]);
      });
      it('should return a list of deleted documents', async () => {
        return expect(col.deleteMany({_id: 'foo'})).to.eventually.eql([{_id: 'foo'}]);
      });
    });
  })
});
