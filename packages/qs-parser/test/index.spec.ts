import 'mocha';
import chai from 'chai';

import {QueryString, lhsColon, rhsColon} from '../src';

const { expect } = chai;

describe('nestedSort', () => {
  it('should parse sort with default config', () => {
    expect(new QueryString('sort[foo]=1&sort[bar]=-1').nestedSort())
      .to.eql({foo: 1, bar: -1});
  });
  it('should parse sort with custom configuration', () => {
    const config = {
      param: 'order',
      asc: 'asc',
      desc: 'desc',
    };
    expect(new QueryString('order[foo]=asc&order[bar]=desc').nestedSort(config))
      .to.eql({foo: 1, bar: -1});
  });
});

describe('delimitedSort', () => {
  it('should parse sort with default config', () => {
    expect(new QueryString('sort=foo,-bar').delimitedSort())
      .to.eql({foo: 1, bar: -1});
  });
  it('should parse sort with custom param', () => {
    expect(new QueryString('order=foo,-bar').delimitedSort({param: 'order'}))
      .to.eql({foo: 1, bar: -1});
  });
});

describe('flatFilter', () => {
  it('should parse filter with lhs colon', () => {
    const config = {exclude: [], operator: lhsColon};
    expect(new QueryString('foo:lt=5&foo:gt=3').flatFilter(config))
      .to.eql({foo: {$lt: 5, $gt: 3}});
  });
  it('should parse filter with rhs colon', () => {
    const config = {exclude: [], operator: rhsColon};
    expect(new QueryString('foo=lt:5&foo=gt:3').flatFilter(config))
      .to.eql({foo: {$lt: 5, $gt: 3}});
  });
});

describe('nestedFilter', () => {
  it('should parse filter with default config', () => {
    expect(new QueryString('filter[foo][$eq]=5').nestedFilter())
      .to.eql({foo: {$eq: 5}});
  });
  it('should parse filter with without types', () => {
    expect(new QueryString('filter[foo][$eq]=5').nestedFilter({types: false}))
      .to.eql({foo: {$eq: '5'}});
  });
});

describe('delimitedProjection', () => {
  it('should parse projection with default config', () => {
    expect(new QueryString('projection=foo,bar').delimitedProjection())
      .to.eql({foo: 1, bar: 1});
  });
  it('should parse projection with custom param', () => {
    expect(new QueryString('fields=foo,bar').delimitedProjection('fields'))
      .to.eql({foo: 1, bar: 1});
  });
});
