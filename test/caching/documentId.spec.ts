import {DocumentIdEvaluator} from '../../src/caching/documentId';
import {expect} from 'chai';
import 'mocha';

describe('DocumentIdEvaluator', () => {
  let evaluator = new DocumentIdEvaluator();

  it('should initially not have a given document cached', () => {
    expect(evaluator.isCached({_id: 'foo'}, {})).to.equal(false);
  });
  it('should cache one document', () => {
    expect(evaluator.add({_id: 'foo'}));
    expect(evaluator.isCached({_id: 'foo'}, {})).to.equal(true);
    expect(evaluator.isCached({_id: 'bar'}, {})).to.equal(false);
  });
});
