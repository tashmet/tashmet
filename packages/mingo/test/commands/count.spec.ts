import { expect } from 'chai';
import 'mocha';
import { MingoDatabaseStore } from '../../src/command';
import { CountCommandHandler } from '../../src/commands/count';


let store: MingoDatabaseStore;

describe('CountCommandHandler', () => {
  describe('without query', () => {
    before(() => {
      store = new MingoDatabaseStore('testdb', {'test': []});
    });

    it('should return zero count on empty collection', () => {
      const result = new CountCommandHandler(store, {}).execute({
        count: 'test',
      });
      expect(result).to.eql({n: 0, ok: 1});
    });

    it('should return correct count on non-empty collection', () => { 
      store.collections['test'].push({title: 'foo'});
      const result = new CountCommandHandler(store, {}).execute({
        count: 'test',
      });
      expect(result).to.eql({n: 1, ok: 1});
    });
  });

  describe('with query', () => {
    before(() => {
      store = new MingoDatabaseStore('testdb', {'test': [
        {title: 'foo', author: 'bar'},
        {title: 'foo', author: 'baz'},
        {title: 'bar', author: 'foo'},
      ]});
    });

    it('should return zero count when no document matches query', () => {
      const result = new CountCommandHandler(store, {}).execute({
        count: 'test',
        query: {title: 'baz'}
      });
      expect(result).to.eql({n: 0, ok: 1});
    });

    it('should return correct count when documents match query', () => {
      const result = new CountCommandHandler(store, {}).execute({
        count: 'test',
        query: {title: 'foo'}
      });
      expect(result).to.eql({n: 2, ok: 1});
    });

    it('should handle skip', () => {
      const result = new CountCommandHandler(store, {}).execute({
        count: 'test',
        query: {title: 'foo'},
        skip: 1
      });
      expect(result).to.eql({n: 1, ok: 1});
    });

    it('should handle limit', () => {
      const result = new CountCommandHandler(store, {}).execute({
        count: 'test',
        query: {title: 'foo'},
        limit: 1
      });
      expect(result).to.eql({n: 1, ok: 1});
    });
  });
});
