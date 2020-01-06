import {SortingOrder} from '../../../../src/interfaces';
import {SortByAnnotation} from '../../../../src/view/decorators/sort';
import {expect} from 'chai';
import 'mocha';
import { Query } from '../../../../src/view/view';

describe('SortBy', () => {
  class TestView {}

  it('should apply sorting to query options', () => {
    let query = new Query();
    new SortByAnnotation('foo', TestView, '').apply(query, SortingOrder.Ascending);

    expect(query.options).to.be.eql({
       sort: {foo: SortingOrder.Ascending}
    });
  });

  it('should be able to apply more sorting filters', () => {
    let query = new Query();
    new SortByAnnotation('foo', TestView, '').apply(query, SortingOrder.Descending);
    new SortByAnnotation('bar', TestView, '').apply(query, SortingOrder.Ascending);

    expect(query.options).to.be.eql({
       sort: {
         foo: SortingOrder.Descending,
         bar: SortingOrder.Ascending
       }
    });
  });

  it('should not apply sorting when value is undefined', () => {
    let query = new Query();
    new SortByAnnotation('foo', TestView, '').apply(query, undefined);

    expect(query.options).to.be.eql({});
  });
});
