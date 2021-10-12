import {QueryOptions, SortingDirection} from '@ziqquratu/database';
import {expect} from 'chai';
import 'mocha';
import {Param} from '../src/interfaces';
import {flatQuery} from '../src/query/flat';
import {multiParamFilter, lhsBrackets, lhsColon, rhsColon} from '../src/query/filter';

describe('serializeFilter', () => {
  it('should serialize using LHSBrackets', async () => {
    const s = multiParamFilter({format: lhsBrackets});
    const filter = {
      'item.amount': {$gte: 2, $lte: 10},
    }
    expect(s({filter})).to.eql([
      new Param('item.amount[gte]', 2),
      new Param('item.amount[lte]', 10)
    ]);
  });

  it('should serialize using LHSColon', async () => {
    const s = multiParamFilter({format: lhsColon});
    const filter = {
      'item.amount': {$gte: 2, $lte: 10},
    }
    expect(s({filter})).to.eql([
      new Param('item.amount:gte', 2),
      new Param('item.amount:lte', 10)
    ]);
  });

  it('should serialize using RHSColon', async () => {
    const s = multiParamFilter({format: rhsColon});
    const filter = {
      'item.amount': {$gte: 2, $lte: 10},
    }
    expect(s({filter})).to.eql([
      new Param('item.amount', 'gte:2'),
      new Param('item.amount', 'lte:10')
    ]);
  });

  it('should serialize equality without operator', async () => {
    const s = multiParamFilter({format: lhsColon});
    const filter = {
      category: 'foo',
    }
    expect(s({filter})).to.eql([
      new Param('category', 'foo')
    ]);
  });

  it('should simplify equality operator', async () => {
    const s = multiParamFilter({format: lhsColon});
    const filter = {
      category: {$eq: 'foo'},
    }
    expect(s({filter})).to.eql([
      new Param('category', 'foo')
    ]);
  });

  it('should serialize array operations', async () => {
    const s = multiParamFilter({format: lhsColon});
    const filter = {
      category: {$in: ['foo', 'bar']},
    }
    expect(s({filter})).to.eql([
      new Param('category:in', 'foo,bar')
    ]);
  });

  it('should serialize array equality', async () => {
    const s = multiParamFilter({format: lhsColon});
    const filter = {
      category: ['foo', 'bar'],
    }
    expect(s({filter})).to.eql([
      new Param('category', 'foo,bar')
    ]);
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
      skip: 10,
      limit: 10,
    }
    expect(qb.serialize(filter, options)).to.eql(
      '/api/test?foo:gte=2&foo:lte=10&sort=category,-datePublished&skip=10&limit=10'
    );
  });
});
