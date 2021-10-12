import 'mocha';
import {expect} from 'chai';

import {nestedSort, nestedFilter, delimitedSort} from '../src/query';

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

describe('nestedFilter', () => {
  const parse = nestedFilter();

  it('should get all documents', () => {
    expect(parse('filter[foo][$eq]=5')).to.eql({filter: {foo: {$eq: 5}}});
  });
});
