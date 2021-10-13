import {QueryOptions} from '@ziqquratu/database';
import {expect} from 'chai';
import 'mocha';
import {flatQuery} from '../src/query/flat';

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
