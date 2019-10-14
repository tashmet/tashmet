import {HttpCollection} from '../../src/collections/http';
import {expect} from 'chai';
import 'mocha';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import fetchMock from 'fetch-mock';

chai.use(require('chai-fetch-mock'));
chai.use(chaiAsPromised);

describe('HttpCollection', () => {
  let col = new HttpCollection('test', {path: '/api/test'});

  before(() => {

    fetchMock.head('/api/test?selector=%7B%22_id%22%3A%22foo%22%7D', {
      headers: {'x-total-count': 1}
    });
    fetchMock.get('/api/test?selector=%7B%22_id%22%3A%22foo%22%7D', {
      body: {_id: 'foo'},
      headers: {'x-total-count': 1}
    });

    fetchMock.head('*', {headers: {'x-total-count': 0}});
    fetchMock.post('/api/test', {body: {_id: 'bar', extra: 'added by server'}});
  });

  after(() => {
    fetchMock.restore();
  });

  describe('count', () => {
    it('should get count from "x-total-count" header', async () => {
      expect(col.count({_id: 'foo'})).to.eventually.eql(1);
    });
  });

  describe('upsert', () => {
    it('should POST if document does not exist', async () => {
      expect(col.upsert({_id: 'bar'})).to.eventually.eql({_id: 'bar', extra: 'added by server'});
    });
  });
});
