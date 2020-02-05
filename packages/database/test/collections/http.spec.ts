import {HttpCollection} from '../../src/collections/http';
import {expect} from 'chai';
import 'mocha';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import fetchMock from 'fetch-mock';
import { QueryOptions } from '../../dist';

chai.use(require('chai-fetch-mock'));
chai.use(chaiAsPromised);

function uri(path: string, selector: object, options?: QueryOptions) {
  const s = encodeURIComponent(JSON.stringify(selector));
  const o = encodeURIComponent(JSON.stringify(options));

  return options ? `${path}?selector=${s}&options=${o}` : `${path}?selector=${s}`
}

function matchBody(body: any) {
  return (url: string, opts: any) => opts.body === JSON.stringify(body);
}

describe('HttpCollection', () => {
  const col = new HttpCollection('test', {path: '/api/test'});

  before(() => {
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
      expect(col.find({_id: 'foo'}).count()).to.eventually.eql(1);
    });
  });

  describe('insertOne', () => {
    before(() => {
      fetchMock.post(matchBody({_id: 'bar'}), {body: {_id: 'bar', server: 'added'}});
      fetchMock.post(matchBody({_id: 'foo'}), {throws: new Error('ID already exists')});
      fetchMock.put('/api/test/foo', {body: {_id: 'foo', server: 'updated'}});
    });

    after(() => {
      fetchMock.restore();
    });

    it('should POST if document does not exist on server', async () => {
      expect(col.insertOne({_id: 'bar'})).to.eventually.eql({_id: 'bar', server: 'added'});
    });
    it('should throw if document already exists on server', () => {
      expect(col.insertOne({_id: 'foo'})).to.eventually.be.rejected;
    });
  });

  describe('replaceOne', () => {
    before(() => {
      fetchMock.get(uri('/api/test', {_id: 'foo'}, {limit: 1}), {
        body: [{_id: 'foo'}],
      });
      fetchMock.get(uri('/api/test', {_id: 'bar'}, {limit: 1}), {
        body: [],
      });
      fetchMock.post(matchBody({_id: 'bar'}), {body: {_id: 'bar', server: 'added'}});
      fetchMock.put('/api/test/foo', {body: {_id: 'foo', server: 'updated'}});
    });

    after(() => {
      fetchMock.restore();
    });

    it('should PUT if document exists on server', async () => {
      expect(col.replaceOne({_id: 'foo'}, {})).to.eventually.eql({_id: 'foo', server: 'updated'});
    });
    it('should return null if no document matched selector', async () => {
      expect(col.replaceOne({_id: 'bar'}, {})).to.eventually.eql(null);
    });
    it('should post when upsert is specified', async () => {
      expect(col.replaceOne({_id: 'bar'}, {_id: 'bar'}, {upsert: true})).to.eventually.eql({_id: 'bar', server: 'added'});
    });
  });
});
