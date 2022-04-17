import { expect } from 'chai';
import 'mocha';
import { MingoDatabaseStore } from '../../src/command';
import { FindCommandHandler } from '../../src/commands/find';
import { GetMoreCommandHandler } from '../../src/commands/getMore';


let store: MingoDatabaseStore;

describe('FindCommandHandler', () => {
  describe('without query', () => {
    before(() => {
      store = new MingoDatabaseStore('testdb', {'test': []});
    });

    it('should return empty batch on empty collection', () => {
      const {cursor, ok} = new FindCommandHandler(store, {}).execute({
        find: 'test',
      });
      expect(ok).to.eql(1);
      expect(cursor.firstBatch).to.eql([]);
      expect(cursor.ns).to.eql({db: 'testdb', coll: 'test'});
    });

    it('should return correct result on non-empty collection', () => { 
      store.collections['test'].push({title: 'foo'});
      const {cursor, ok} = new FindCommandHandler(store, {}).execute({
        find: 'test',
      });
      expect(ok).to.eql(1);
      expect(cursor.firstBatch).to.eql([{title: 'foo'}]);
      expect(cursor.ns).to.eql({db: 'testdb', coll: 'test'});
    });
  });

  describe('with query', () => {
    before(() => {
      store = new MingoDatabaseStore('testdb', {'test': [
        {_id: 1, title: 'foo', author: 'bar'},
        {_id: 2, title: 'foo', author: 'baz'},
        {_id: 3, title: 'bar', author: 'foo'},
      ]});
    });

    it('should return empty batch when no document matches query', () => {
      const {cursor} = new FindCommandHandler(store, {}).execute({
        find: 'test',
        filter: {title: 'baz'}
      });
      expect(cursor.firstBatch).to.eql([]);
    });

    it('should return correct batch when documents match query', () => {
      const {cursor} = new FindCommandHandler(store, {}).execute({
        find: 'test',
        filter: {title: 'foo'}
      });
      expect(cursor.firstBatch).to.eql([
        {_id: 1, title: 'foo', author: 'bar'},
        {_id: 2, title: 'foo', author: 'baz'},
      ]);
    });

    it('should handle skip', () => {
      const {cursor} = new FindCommandHandler(store, {}).execute({
        find: 'test',
        filter: {title: 'foo'},
        skip: 1,
      });
      expect(cursor.firstBatch).to.eql([
        {_id: 2, title: 'foo', author: 'baz'},
      ]);
    });

    it('should handle limit', () => {
      const {cursor} = new FindCommandHandler(store, {}).execute({
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
      store = new MingoDatabaseStore('testdb', {'test': [
        {_id: 1, title: 'foo', author: 'bar'},
        {_id: 2, title: 'foo', author: 'baz'},
        {_id: 3, title: 'bar', author: 'foo'},
      ]});
    });

    it('should get initial batch', () => {
      const {cursor} = new FindCommandHandler(store, {}).execute({
        find: 'test',
        filter: {title: 'foo'},
        batchSize: 1,
      });
      cursorId = cursor.id;
      expect(cursor.firstBatch).to.eql([
        {_id: 1, title: 'foo', author: 'bar'},
      ]);
    });

    it('should get more', () => {
      const {cursor} = new GetMoreCommandHandler(store, {}).execute({
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
