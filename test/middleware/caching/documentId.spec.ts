import {DocumentIdEvaluator} from '../../../src/middleware/caching/documentId';
import {Document} from '../../../src/models/document';
import {expect} from 'chai';
import 'mocha';

describe('DocumentIdEvaluator', () => {
  let evaluator = new DocumentIdEvaluator();

  describe('single id', () => {
    it('should initially not have a given document cached', () => {
      const q = {selector: {_id: 'foo'}, options: {}, cached: false};
      expect(evaluator.processQuery(q)).to.have.property('cached', false);
    });
    it('should cache one document', () => {
      const q = {selector: {_id: 'foo'}, options: {}, cached: false};
      evaluator.add(new Document('foo'));
      expect(evaluator.processQuery(q)).to.have.property('cached', true);
    });
  });

  describe('list of ids using $in', () => {
    it('should consider empty list cached', () => {
      const q = {selector: {_id: {$in: []}}, options: {}, cached: false};
      expect(evaluator.processQuery(q)).to.have.property('cached', true);
    });
    it('should consider list with only cached ids cached', () => {
      const q = {selector: {_id: {$in: ['foo']}}, options: {}, cached: false};
      expect(evaluator.processQuery(q)).to.have.property('cached', true);
    });
    it('should optimize partially cached query', () => {
      const qIn  = {selector: {_id: {$in: ['foo', 'bar']}}, options: {}, cached: false};
      const qOut = {selector: {_id: {$in: ['bar']}}, options: {}, cached: false};
      expect(evaluator.processQuery(qIn)).to.deep.equal(qOut);
    });
  });
});
