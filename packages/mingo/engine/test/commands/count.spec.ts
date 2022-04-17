import { expect } from 'chai';
import 'mocha';
import { MemoryStorageEngine, MingoCursorRegistry } from '../../src/storageEngine';
import { CountCommandHandler } from '../../src/commands/count';


let store: MemoryStorageEngine;
let count: CountCommandHandler;

describe('CountCommandHandler', () => {
  describe('without query', () => {
    before(() => {
      store = new MemoryStorageEngine('testdb', {'test': []})
      count = new CountCommandHandler(new MingoCursorRegistry(), store);
    });

    it('should return zero count on empty collection', async () => {
      const result = await count.execute({
        count: 'test',
      });
      expect(result).to.eql({n: 0, ok: 1});
    });

    it('should return correct count on non-empty collection', async () => { 
      store.insert('test', {title: 'foo'});
      const result = await count.execute({
        count: 'test',
      });
      expect(result).to.eql({n: 1, ok: 1});
    });
  });

  describe('with query', () => {
    before(() => {
      store = new MemoryStorageEngine('testdb', {'test': [
        {title: 'foo', author: 'bar'},
        {title: 'foo', author: 'baz'},
        {title: 'bar', author: 'foo'},
      ]});
      count = new CountCommandHandler(new MingoCursorRegistry(), store);
    });

    it('should return zero count when no document matches query', async () => {
      const result = await count.execute({
        count: 'test',
        query: {title: 'baz'}
      });
      expect(result).to.eql({n: 0, ok: 1});
    });

    it('should return correct count when documents match query', async () => {
      const result = await count.execute({
        count: 'test',
        query: {title: 'foo'}
      });
      expect(result).to.eql({n: 2, ok: 1});
    });

    it('should handle skip', async () => {
      const result = await count.execute({
        count: 'test',
        query: {title: 'foo'},
        skip: 1
      });
      expect(result).to.eql({n: 1, ok: 1});
    });

    it('should handle limit', async () => {
      const result = await count.execute({
        count: 'test',
        query: {title: 'foo'},
        limit: 1
      });
      expect(result).to.eql({n: 1, ok: 1});
    });
  });
});
