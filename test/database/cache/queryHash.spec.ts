import {QueryHashEvaluator} from '../../../src/database/cache/queryHash';
import {expect} from 'chai';
import 'mocha';

describe('QueryHashEvaluator', () => {
  let evaluator = new QueryHashEvaluator();

  it('should initially not have a given query cached', () => {
    expect(evaluator.isCached({}, {})).to.equal(false);
  });
  it('should cache one query', () => {
    expect(evaluator.setCached({}, {}));
    expect(evaluator.isCached({}, {})).to.equal(true);
  });
  it('should only cache a specific query', () => {
    expect(evaluator.setCached({foo: 1}, {limit: 1}));
    expect(evaluator.isCached({foo: 1}, {limit: 1})).to.equal(true);
    expect(evaluator.isCached({foo: 2}, {limit: 1})).to.equal(false);
    expect(evaluator.isCached({foo: 1}, {limit: 2})).to.equal(false);
  });
});
