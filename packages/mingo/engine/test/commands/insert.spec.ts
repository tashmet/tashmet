import {expect} from 'chai';
import 'mocha';
import { MingoDatabaseEngine } from '../../src';
import { MemoryStorageEngine } from '../../src/storageEngine';


let store = new MemoryStorageEngine('testdb');
let engine = MingoDatabaseEngine.fromMemory(store);

describe('insert', () => {
  describe('successful insert', () => {
    before(async () => {
      await store.create('test', {});
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

    it('should have inserted the documents into the store', async () => {
      const it = store.stream('test');
      expect((await it.next()).value.title).to.eql('foo');
      expect((await it.next()).value.title).to.eql('bar');
      expect((await it.next()).done).to.eql(true);
    });
  });

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
});
