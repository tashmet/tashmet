import {FindOptions} from '@tashmet/tashmet';
import chai from 'chai';
import 'mocha';
import {QuerySerializer} from '../src';

const { expect } = chai;

describe('QuerySerializer', () => {
  const filter = {
    foo: {$gte: 2, $lte: 10},
  }
  const options: FindOptions = {
    sort: {
      category: 1,
      datePublished: -1,
    },
    projection: {foo: 1, bar: 1},
    skip: 10,
    limit: 10,
  }

  it('should serialize a flat query', async () => {
    const qs = QuerySerializer.flat();

    expect(qs.serialize({filter, ...options})).to.eql(
      'foo:gte=2&foo:lte=10&sort=category,-datePublished&projection=foo,bar&skip=10&limit=10'
    );
  });

  it('should serialize a nested query', async () => {
    const qs = QuerySerializer.nested();

    expect(qs.serialize({filter, ...options})).to.eql(
      'filter[foo][%24gte]=2&filter[foo][%24lte]=10&sort[category]=1&sort[datePublished]=-1&projection[foo]=1&projection[bar]=1&skip=10&limit=10'
    );
  });
});
