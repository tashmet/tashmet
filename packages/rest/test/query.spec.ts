import {QueryOptions} from '@ziqquratu/database';
import {expect} from 'chai';
import 'mocha';
import {flatQuery} from '../src/query/flat';
import {flatFilter, lhsBrackets, lhsColon, rhsColon} from '../src/query/filter';
import { delimitedSort } from '../src/query/sort';
import { delimitedProjection } from '../src/query/projection';

describe('flatFilter', () => {
  it('should serialize using LHSBrackets', async () => {
    const s = flatFilter({format: lhsBrackets});
    const filter = {
      'item.amount': {$gte: 2, $lte: 10},
    }
    expect(s({filter})).to.eql('item.amount[gte]=2&item.amount[lte]=10');
  });

  it('should serialize using LHSColon', async () => {
    const s = flatFilter({format: lhsColon});
    const filter = {
      'item.amount': {$gte: 2, $lte: 10},
    }
    expect(s({filter})).to.eql('item.amount:gte=2&item.amount:lte=10');
  });

  it('should serialize using RHSColon', async () => {
    const s = flatFilter({format: rhsColon});
    const filter = {
      'item.amount': {$gte: 2, $lte: 10},
    }
    expect(s({filter})).to.eql('item.amount=gte:2&item.amount=lte:10');
  });

  it('should serialize equality without operator', async () => {
    const s = flatFilter({format: lhsColon});
    const filter = {
      category: 'foo',
    }
    expect(s({filter})).to.eql('category=foo');
  });

  it('should simplify equality operator', async () => {
    const s = flatFilter({format: lhsColon});
    const filter = {
      category: {$eq: 'foo'},
    }
    expect(s({filter})).to.eql('category=foo');
  });

  it('should serialize array operations', async () => {
    const s = flatFilter({format: lhsColon});
    const filter = {
      category: {$in: ['foo', 'bar']},
    }
    expect(s({filter})).to.eql('category:in=foo,bar');
  });

  it('should serialize array equality', async () => {
    const s = flatFilter({format: lhsColon});
    const filter = {
      category: ['foo', 'bar'],
    }
    expect(s({filter})).to.eql('category=foo,bar');
  });
});

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

describe('delimitedProjection', () => {
  it('should serialize single projection field', async () => {
    const s = delimitedProjection();
    const projection = {
      'item.amount': true,
    }
    expect(s({projection})).to.eql('projection=item.amount');
  });

  it('should serialize multiple projection fields', async () => {
    const s = delimitedProjection();
    const projection = {
      foo: true,
      bar1: true,
      bar2: false,
    }
    expect(s({projection})).to.eql('projection=foo,bar1');
  });

  it('should serialize projection with custom configuration', async () => {
    const s = delimitedProjection({
      param: 'fields',
      separator: ';',
    });
    const projection = {
      foo: true,
      bar: true,
    }
    expect(s({projection})).to.eql('fields=foo;bar');
  });
});

describe('HttpQueryBuilder', () => {
  it('should serialize a complete query', async () => {
    const qb = flatQuery()('/api/test');

    const filter = {
      foo: {$gte: 2, $lte: 10},
    }
    const options: QueryOptions = {
      sort: {
        category: 1,
        datePublished: -1,
      },
      projection: {foo: 1, bar: 1},
      skip: 10,
      limit: 10,
    }
    expect(qb.serialize(filter, options)).to.eql(
      '/api/test?foo:gte=2&foo:lte=10&sort=category,-datePublished&projection=foo,bar&skip=10&limit=10'
    );
  });
});
