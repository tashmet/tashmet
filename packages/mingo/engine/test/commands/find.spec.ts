import { expect } from 'chai';
import 'mocha';
import { MemoryStorageEngine, MingoCursorRegistry } from '../../src/storageEngine';
import { FindCommandHandler } from '../../src/commands/find';
import { GetMoreCommandHandler } from '../../src/commands/getMore';


let store = new MemoryStorageEngine('testdb');
let cursors = new MingoCursorRegistry();
let find: FindCommandHandler;
let getMore: GetMoreCommandHandler;

describe('FindCommandHandler', () => {
  before(async () => {
    await store.create('test');
    find = new FindCommandHandler(cursors, store);
    getMore = new GetMoreCommandHandler(cursors, store);
  });

  describe('without query', () => {
    it('should return empty batch on empty collection', async () => {
      const {cursor, ok} = await find.execute({
        find: 'test',
      });
      expect(ok).to.eql(1);
      expect(cursor.firstBatch).to.eql([]);
      expect(cursor.ns).to.eql({db: 'testdb', coll: 'test'});
    });

    it('should return correct result on non-empty collection', async () => { 
      await store.insert('test', {title: 'foo'});
      const {cursor, ok} = await find.execute({
        find: 'test',
      });
      expect(ok).to.eql(1);
      expect(cursor.firstBatch).to.eql([{title: 'foo'}]);
      expect(cursor.ns).to.eql({db: 'testdb', coll: 'test'});
    });
  });

  describe('with query', () => {
    before(async () => {
      await store.drop('test');
      await store.create('test');
      await store.insert('test', {_id: 1, title: 'foo', author: 'bar'});
      await store.insert('test', {_id: 2, title: 'foo', author: 'baz'});
      await store.insert('test', {_id: 3, title: 'bar', author: 'foo'});
    });

    it('should return empty batch when no document matches query', async () => {
      const {cursor} = await find.execute({
        find: 'test',
        filter: {title: 'baz'}
      });
      expect(cursor.firstBatch).to.eql([]);
    });

    it('should return correct batch when documents match query', async () => {
      const {cursor} = await find.execute({
        find: 'test',
        filter: {title: 'foo'}
      });
      expect(cursor.firstBatch).to.eql([
        {_id: 1, title: 'foo', author: 'bar'},
        {_id: 2, title: 'foo', author: 'baz'},
      ]);
    });

    it('should handle skip', async () => {
      const {cursor} = await find.execute({
        find: 'test',
        filter: {title: 'foo'},
        skip: 1,
      });
      expect(cursor.firstBatch).to.eql([
        {_id: 2, title: 'foo', author: 'baz'},
      ]);
    });

    it('should handle limit', async () => {
      const {cursor} = await find.execute({
        find: 'test',
        filter: {title: 'foo'},
        limit: 1
      });
      expect(cursor.firstBatch).to.eql([
        {_id: 1, title: 'foo', author: 'bar'},
      ]);
    });
  });

  describe('custom batch size', () => {
    let cursorId: undefined;

    before(() => {
      store = new MemoryStorageEngine('testdb', {'test': [
        {_id: 1, title: 'foo', author: 'bar'},
        {_id: 2, title: 'foo', author: 'baz'},
        {_id: 3, title: 'bar', author: 'foo'},
      ]});
    });

    it('should get initial batch', async () => {
      const {cursor} = await find.execute({
        find: 'test',
        filter: {title: 'foo'},
        batchSize: 1,
      });
      cursorId = cursor.id;
      expect(cursor.firstBatch).to.eql([
        {_id: 1, title: 'foo', author: 'bar'},
      ]);
    });

    it('should get more', async () => {
      const {cursor} = await getMore.execute({
        getMore: cursorId,
        collection: 'test',
        batchSize: 1,
      });
      expect(cursor.nextBatch).to.eql([
        {_id: 2, title: 'foo', author: 'baz'},
      ]);
    });
  });
});
