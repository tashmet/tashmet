import {QueryHashEvaluator} from '../../../src/middleware/caching/queryHash';
import {expect} from 'chai';
import 'mocha';

describe('QueryHashEvaluator', () => {
  let ev = new QueryHashEvaluator();

  it('should initially not have a given query cached', () => {
    const q = {selector: {}, options: {}, cached: false};
    expect(ev.processCacheQuery(q)).to.have.property('cached', false);
  });
  it('should cache one query', () => {
    const q = {selector: {}, options: {}, cached: false};

    ev.processSourceQuery({selector: {}, options: {}});
    expect(ev.processCacheQuery(q)).to.have.property('cached', true);
  });
  it('should only cache a specific query', () => {
    ev.processSourceQuery({selector: {foo: 1}, options: {limit: 1}});

    expect(ev.processCacheQuery({selector: {foo: 1}, options: {limit: 1}, cached: false}))
      .to.have.property('cached', true);
    expect(ev.processCacheQuery({selector: {foo: 2}, options: {limit: 1}, cached: false}))
      .to.have.property('cached', false);
    expect(ev.processCacheQuery({selector: {foo: 1}, options: {limit: 2}, cached: false}))
      .to.have.property('cached', false);
  });
});
