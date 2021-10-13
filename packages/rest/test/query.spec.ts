import {QueryOptions} from '@ziqquratu/database';
import {expect} from 'chai';
import 'mocha';
import {flatQuery} from '../src/query/flat';
import {nestedQuery} from '../src/query/nested';

describe('HttpQueryBuilder', () => {
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

  it('should serialize a flat query', async () => {
    const qb = flatQuery()('/api/test');

    expect(qb.serialize(filter, options)).to.eql(
      '/api/test?foo:gte=2&foo:lte=10&sort=category,-datePublished&projection=foo,bar&skip=10&limit=10'
    );
  });

  it('should serialize a nested query', async () => {
    const qb = nestedQuery()('/api/test');

    expect(qb.serialize(filter, options)).to.eql(
      '/api/test?filter[foo][%24gte]=2&filter[foo][%24lte]=10&sort[category]=1&sort[datePublished]=-1&projection[foo]=1&projection[bar]=1&skip=10&limit=10'
    );
  });
});
