import 'mocha';
import {expect} from 'chai';

import {nestedSort, nestedFilter, delimitedSort, delimitedProjection, flatFilter, lhsColon, rhsColon} from '../src/query';

describe('nestedSort', () => {
  it('should parse sort with default config', () => {
    const parse = nestedSort();
    expect(parse('sort[foo]=1&sort[bar]=-1')).to.eql({sort: {foo: 1, bar: -1}});
  });
  it('should parse sort with custom configuration', () => {
    const parse = nestedSort({
      param: 'order',
      asc: 'asc',
      desc: 'desc',
    });
    expect(parse('order[foo]=asc&order[bar]=desc')).to.eql({sort: {foo: 1, bar: -1}});
  });
});

describe('delimitedSort', () => {
  it('should parse sort with default config', () => {
    const parse = delimitedSort();
    expect(parse('sort=foo,-bar')).to.eql({sort: {foo: 1, bar: -1}});
  });
});

describe('flatFilter', () => {
  it('should parse filter with lhs colon', () => {
    const parse = flatFilter({exclude: [], operator: lhsColon});
    expect(parse('foo:lt=5&foo:gt=3')).to.eql({filter: {foo: {$lt: 5, $gt: 3}}});
  });
  it('should parse filter with rhs colon', () => {
    const parse = flatFilter({exclude: [], operator: rhsColon});
    expect(parse('foo=lt:5&foo=gt:3')).to.eql({filter: {foo: {$lt: 5, $gt: 3}}});
  });
});

describe('nestedFilter', () => {
  it('should parse filter with default config', () => {
    const parse = nestedFilter();
    expect(parse('filter[foo][$eq]=5')).to.eql({filter: {foo: {$eq: 5}}});
  });
  it('should parse filter with without types', () => {
    const parse = nestedFilter({types: false});
    expect(parse('filter[foo][$eq]=5')).to.eql({filter: {foo: {$eq: '5'}}});
  });
});

describe('delimitedProjection', () => {
  it('should parse projection with default config', () => {
    const parse = delimitedProjection();
    expect(parse('projection=foo,bar')).to.eql({projection: {foo: 1, bar: 1}});
  });
  it('should parse projection with custom config', () => {
    const parse = delimitedProjection('fields');
    expect(parse('fields=foo,bar')).to.eql({projection: {foo: 1, bar: 1}});
  });
});
