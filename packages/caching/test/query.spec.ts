import {QueryCache} from '../src/query';
import {expect} from 'chai';
import 'mocha';

describe('QueryCache', () => {
  const queryCache = new QueryCache();

  it('should initially not have a given query cached', () => {
    expect(queryCache.isCached({})).to.eql(false);
  });
  it('should cache one query', () => {
    queryCache.success({}, {});
    expect(queryCache.isCached({}, {})).to.eql(true);
  });
  it('should only cache a specific query', () => {
    queryCache.success({foo: 1}, {limit: 1});

    expect(queryCache.isCached({foo: 1}, {limit: 1})).to.eql(true);
    expect(queryCache.isCached({foo: 2}, {limit: 1})).to.eql(false);
    expect(queryCache.isCached({foo: 1}, {limit: 2})).to.eql(false);
  });
});
