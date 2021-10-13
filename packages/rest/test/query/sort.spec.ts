import {expect} from 'chai';
import 'mocha';
import {delimitedSort, nestedSort} from '../../src/query/sort';

describe('delimitedSort', () => {
  it('should serialize single sort field', async () => {
    const s = delimitedSort();
    const sort = {
      'item.amount': 1,
    }
    expect(s({sort})).to.eql('sort=item.amount');
  });

  it('should serialize multiple sort fields', async () => {
    const s = delimitedSort();
    const sort = {
      foo: 1,
      bar: -1,
    }
    expect(s({sort})).to.eql('sort=foo,-bar');
  });

  it('should serialize sort with custom configuration', async () => {
    const s = delimitedSort({
      param: 'order',
      asc: k => `${k}:asc`,
      desc: k => `${k}:desc`,
      separator: ';',
    });
    const sort = {
      foo: 1,
      bar: -1,
    }
    expect(s({sort})).to.eql('order=foo:asc;bar:desc');
  });
});

describe('nestedSort', () => {
  it('should serialize sort with default param', async () => {
    const s = nestedSort();
    const sort = {
      foo: 1,
      bar: -1,
    }
    expect(s({sort})).to.eql('sort[foo]=1&sort[bar]=-1');
  });

  it('should serialize sort with custom param', async () => {
    const s = nestedSort('order');
    const sort = {
      foo: 1,
      bar: -1,
    }
    expect(s({sort})).to.eql('order[foo]=1&order[bar]=-1');
  });

  it('should serialize to empty string with empty sort', async () => {
    const s = nestedSort();
    const sort = {}
    expect(s({sort})).to.eql('');
  });
});
