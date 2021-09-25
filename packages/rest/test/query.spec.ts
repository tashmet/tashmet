import { QueryOptions, SortingDirection } from '@ziqquratu/database';
import {expect} from 'chai';
import 'mocha';
import {serializeFilter, lhsBrackets, lhsColon, rhsColon, HttpQueryBuilder, serializeSort} from '../src/query';

describe('serializeFilter', () => {
  it('should serialize using LHSBrackets', async () => {
    const s = serializeFilter({format: lhsBrackets});
    const filter = {
      'item.amount': {$gte: 2, $lte: 10},
    }
    expect(s(filter)).to.eql(['item.amount[gte]=2','item.amount[lte]=10']);
  });

  it('should serialize using LHSColon', async () => {
    const s = serializeFilter({format: lhsColon});
    const filter = {
      'item.amount': {$gte: 2, $lte: 10},
    }
    expect(s(filter)).to.eql(['item.amount:gte=2','item.amount:lte=10']);
  });

  it('should serialize using RHSColon', async () => {
    const s = serializeFilter({format: rhsColon});
    const filter = {
      'item.amount': {$gte: 2, $lte: 10},
    }
    expect(s(filter)).to.eql(['item.amount=gte:2','item.amount=lte:10']);
  });

  it('should serialize equality without operator', async () => {
    const s = serializeFilter({format: lhsColon});
    const filter = {
      category: 'foo',
    }
    expect(s(filter)).to.eql(['category=foo']);
  });

  it('should simplify equality operator', async () => {
    const s = serializeFilter({format: lhsColon});
    const filter = {
      category: {$eq: 'foo'},
    }
    expect(s(filter)).to.eql(['category=foo']);
  });

  it('should serialize array operations', async () => {
    const s = serializeFilter({format: lhsColon});
    const filter = {
      category: {$in: ['foo', 'bar']},
    }
    expect(s(filter)).to.eql(['category:in=foo,bar']);
  });

  it('should serialize array equality', async () => {
    const s = serializeFilter({format: lhsColon});
    const filter = {
      category: ['foo', 'bar'],
    }
    expect(s(filter)).to.eql(['category=foo,bar']);
  });
});

describe('HttpQueryBuilder', () => {
  it('should serialize a complete query', async () => {
    const qb = new HttpQueryBuilder('/api/test', {
      filter: serializeFilter({format: lhsColon}),
      sort: serializeSort(),
    });

    const filter = {
      foo: {$gte: 2, $lte: 10},
    }
    const options: QueryOptions = {
      sort: {
        category: SortingDirection.Ascending,
        datePublished: SortingDirection.Descending,
      },
      skip: 10,
      limit: 10,
    }
    expect(qb.serialize(filter, options)).to.eql(
      '/api/test?foo:gte=2&foo:lte=10&sort=+category,-datePublished&skip=10&limit=10'
    );
  });
});
