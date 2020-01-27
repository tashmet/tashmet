import {SortingOrder} from '@ziqquratu/database';
import {SortByAnnotation} from '../../src/decorators/sort';
import {QueryBuilder} from '../../src/query';
import {expect} from 'chai';
import 'mocha';

describe('SortBy', () => {
  it('should apply sorting to query options', () => {
    const query = new QueryBuilder();
    new SortByAnnotation('foo').apply(query, SortingOrder.Ascending);

    expect(query.options).to.be.eql({
       sort: {foo: SortingOrder.Ascending}
    });
  });

  it('should be able to apply more sorting filters', () => {
    const query = new QueryBuilder();
    new SortByAnnotation('foo').apply(query, SortingOrder.Descending);
    new SortByAnnotation('bar').apply(query, SortingOrder.Ascending);

    expect(query.options).to.be.eql({
       sort: {
         foo: SortingOrder.Descending,
         bar: SortingOrder.Ascending
       }
    });
  });

  it('should not apply sorting when value is undefined', () => {
    const query = new QueryBuilder();
    new SortByAnnotation('foo').apply(query, undefined);

    expect(query.options).to.be.eql({});
  });
});
