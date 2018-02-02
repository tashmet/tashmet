import {DocumentIdEvaluator} from '../../src/caching/documentId';
import {expect} from 'chai';
import 'mocha';

describe('DocumentIdEvaluator', () => {
  let evaluator = new DocumentIdEvaluator();

  describe('single id', () => {
    it('should initially not have a given document cached', () => {
      expect(evaluator.isCached({_id: 'foo'}, {})).to.equal(false);
    });
    it('should cache one document', () => {
      expect(evaluator.add({_id: 'foo'}));
      expect(evaluator.isCached({_id: 'foo'}, {})).to.equal(true);
      expect(evaluator.isCached({_id: 'bar'}, {})).to.equal(false);
    });
  });

  describe('list of ids using $in', () => {
    it('should consider empty list cached', () => {
      expect(evaluator.isCached({_id: {'$in': []}}, {})).to.equal(true);
    });
    it('should consider list with only cached ids cached', () => {
      expect(evaluator.isCached({_id: {'$in': ['foo']}}, {})).to.equal(true);
    });
    it('should consider list with one or more uncached ids uncached', () => {
      expect(evaluator.isCached({_id: {'$in': ['foo', 'bar']}}, {})).to.equal(false);
    });
  });
});
