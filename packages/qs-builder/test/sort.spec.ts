import {expect} from 'chai';
import 'mocha';
import {QueryStringWriter} from '../src';

describe('delimitedSort', () => {
  it('should serialize single sort field', async () => {
    const sort = {
      'item.amount': 1,
    }
    expect(new QueryStringWriter({sort}).delimitedSort())
      .to.eql('sort=item.amount');
  });

  it('should serialize multiple sort fields', async () => {
    const sort = {
      foo: 1,
      bar: -1,
    }
    expect(new QueryStringWriter({sort}).delimitedSort())
      .to.eql('sort=foo,-bar');
  });

  it('should serialize sort with custom configuration', async () => {
    const sort = {
      foo: 1,
      bar: -1,
    }
    expect(
      new QueryStringWriter({sort}).delimitedSort({
        param: 'order',
        asc: k => `${k}:asc`,
        desc: k => `${k}:desc`,
        separator: ';',
      })
    ).to.eql('order=foo:asc;bar:desc');
  });
});

describe('nestedSort', () => {
  it('should serialize sort with default param', async () => {
    const sort = {
      foo: 1,
      bar: -1,
    }
    expect(new QueryStringWriter({sort}).nestedSort())
      .to.eql('sort[foo]=1&sort[bar]=-1');
  });

  it('should serialize sort with custom param', async () => {
    const sort = {
      foo: 1,
      bar: -1,
    }
    expect(new QueryStringWriter({sort}).nestedSort('order'))
      .to.eql('order[foo]=1&order[bar]=-1');
  });

  it('should serialize to empty string with empty sort', async () => {
    const sort = {}
    expect(new QueryStringWriter({sort}).nestedSort())
      .to.eql('');
  });
});
