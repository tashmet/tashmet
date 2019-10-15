import {SortingOrder, QueryOptions} from '../../../src/interfaces';
import {SortingFilter} from '../../../src/view/filters/sort';
import {expect} from 'chai';
import 'mocha';

describe('SortingFilter', () => {
  let filter = new SortingFilter({
    key: 'foo',
    order: SortingOrder.Ascending
  });

  it('should not modify selector', () => {
    let selector = {};
    filter.apply(selector, {});

    expect(selector).to.be.eql({});
  });

  it('should apply sorting to query options', () => {
    let options: QueryOptions = {};
    filter.apply({}, options);

    expect(options).to.be.eql({
       sort: {foo: SortingOrder.Ascending}
    });
  });

  it('should be able to change sorting order', () => {
    let options: QueryOptions = {};
    filter.order = SortingOrder.Descending;
    filter.apply({}, options);

    expect(options).to.be.eql({
       sort: {foo: SortingOrder.Descending}
    });
  });

  it('should be able to change sorting key', () => {
    let options: QueryOptions = {};
    filter.key = 'bar';
    filter.apply({}, options);

    expect(options).to.be.eql({
       sort: {bar: SortingOrder.Descending}
    });
  });

  it('should be able to apply more sorting filters', () => {
    let filter2 = new SortingFilter({
      key: 'other',
      order: SortingOrder.Ascending
    });

    let options: QueryOptions = {};
    filter.apply({}, options);
    filter2.apply({}, options);

    expect(options).to.be.eql({
       sort: {
         bar: SortingOrder.Descending,
         other: SortingOrder.Ascending
       }
    });
  });
});
