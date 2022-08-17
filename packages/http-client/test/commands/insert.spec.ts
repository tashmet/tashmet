import { DatabaseEngine, QueryEngine } from '@tashmet/engine';
import { QuerySerializer } from '@tashmet/qs-builder';
import { HttpDatabaseEngine } from '../../src';
import { HttpStorageEngine } from '../../src/storage';

import {expect} from 'chai';
import * as chai from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import 'mocha';
import { HttpRestLayer } from '../../src/interfaces';
import { HttpQueryable } from '../../src/query';

chai.use(sinonChai);


class MockRestLayer implements HttpRestLayer {
  public async get(path: string, queryString: string = '', head: boolean = false) {
    return {};
  }

  public async put(path: string, doc: any, id: string) {
    return {};
  }

  public async post(path: string, doc: any) {
    return {};
  }

  public async delete(path: string, id: any) {
    return {};
  }
}

let postSpy: sinon.SinonSpy;


describe('insert', () => {
  let store: HttpStorageEngine;
  let engine: DatabaseEngine;

  describe('successful insert', () => {
    before(async () => {
      const restLayer = new MockRestLayer();
      store = new HttpStorageEngine('testdb', restLayer);
      const qEngine = new QueryEngine(new HttpQueryable(QuerySerializer.flat(), restLayer));
      engine = new HttpDatabaseEngine(store, qEngine);
      await store.create('test', {});

      const sandbox = sinon.createSandbox();
      postSpy = sandbox.spy(restLayer, 'post');
    });

    after(async () => {
      await store.drop('test');
      sinon.restore();
    });

    it('should return correct result on success', async () => {
      const result = await engine.command({
        insert: 'test',
        documents: [{title: 'foo'}, {title: 'bar'}]
      });
      expect(result).to.eql({n: 2, ok: 1});
    });

    it('should have called the rest layer', async () => {
      expect(postSpy.callCount).to.eql(2);
      expect(postSpy.getCall(0)).to.have.been.calledWith('test', {_id: undefined, title: 'foo'});
      expect(postSpy.getCall(1)).to.have.been.calledWith('test', {_id: undefined, title: 'bar'});
    });
  });

  /*
  describe('write errors', () => {
    beforeEach(async () => {
      await store.create('test', {});
      await store.insert('test', {_id: 1, title: 'foo'});
    });

    afterEach(async () => {
      await store.drop('test');
    });

    it('should insert remaining documents after initial fail when not ordered', async () => {
      const result = await engine.command({
        insert: 'test',
        documents: [{_id: 1, title: 'foo'}, {_id: 2, title: 'bar'}],
      });
      expect(result).to.eql({n: 1, ok: 1, writeErrors: [{index: 0, errMsg: 'Duplicate id'}]});
    });

    it('should not insert remaining documents after initial fail when ordered', async () => {
      const result = await engine.command({
        insert: 'test',
        documents: [{_id: 1, title: 'foo'}, {_id: 2, title: 'bar'}],
        ordered: true,
      });
      expect(result).to.eql({n: 0, ok: 1, writeErrors: [{index: 0, errMsg: 'Duplicate id'}]});
    });
  });
  */
});
