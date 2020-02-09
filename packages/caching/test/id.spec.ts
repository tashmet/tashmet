import {IDCache} from '../src/id';
import {expect} from 'chai';
import 'mocha';

describe('IDCache', () => {
  const idCache = new IDCache();

  describe('single id', () => {
    it('should initially not have a given document cached', () => {
      expect(idCache.isCached({_id: 'foo'})).to.eql(false);
    });
    it('should cache one document', () => {
      idCache.add({_id: 'foo'});
      expect(idCache.isCached({_id: 'foo'})).to.eql(true);
    });
  });

  describe('list of ids using $in', () => {
    it('should consider empty list cached', () => {
      expect(idCache.isCached({_id: {$in: []}})).to.eql(true);
    });
    it('should consider list with only cached ids cached', () => {
      expect(idCache.isCached({_id: {$in: ['foo']}})).to.eql(true);
    });
    it('should optimize partially cached query', () => {
      const selector = {_id: {$in: ['foo', 'bar']}};
      idCache.optimize(selector);
      expect(selector).to.deep.equal({_id: {$in: ['bar']}});
    });
  });
});
