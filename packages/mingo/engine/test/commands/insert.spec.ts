import {expect} from 'chai';
import 'mocha';
import { MingoDatabaseEngine } from '../../src';
import { MemoryStorageEngine } from '../../src/storageEngine';


let store = new MemoryStorageEngine('testdb');
let engine = new MingoDatabaseEngine(store);

describe('insert', () => {
  describe('successful insert', () => {
    before(async () => {
      await store.create('test');
    });

    after(async () => {
      await store.drop('test');
    });

    it('should return correct result on success', async () => {
      const result = await engine.command({
        insert: 'test',
        documents: [{title: 'foo'}, {title: 'bar'}]
      });
      expect(result).to.eql({n: 2, ok: 1});
    });

    it('should have inserted the documents into the store', () => {
      expect(store.documents('test').length).to.eql(2);
      expect(store.documents('test')[0].title).to.eql('foo');
      expect(store.documents('test')[1].title).to.eql('bar');
    });
  });

  describe('write errors', () => {
    beforeEach(async () => {
      await store.create('test');
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
      expect(result).to.eql({n: 1, ok: 1, writeErrors: [{index: 0, errMsg: 'Duplicate key error'}]});
    });

    it('should not insert remaining documents after initial fail when ordered', async () => {
      const result = await engine.command({
        insert: 'test',
        documents: [{_id: 1, title: 'foo'}, {_id: 2, title: 'bar'}],
        ordered: true,
      });
      expect(result).to.eql({n: 0, ok: 1, writeErrors: [{index: 0, errMsg: 'Duplicate key error'}]});
    });
  });
});
