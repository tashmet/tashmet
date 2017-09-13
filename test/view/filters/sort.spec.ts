import {SortingFilter} from '../../../src/view/filters/sort';
import {View} from '../../../src/view/view';
import {SortingOrder, QueryOptions} from '../../../src/interfaces';
import {expect} from 'chai';
import 'mocha';

describe('SortingFilter', () => {
  let view = new View()
  let filter = new SortingFilter({
    key: 'foo',
    order: SortingOrder.Ascending
  }, view);

  it('should not modify selector', () => {
    let selector = {};
    filter.apply(selector, {});

    expect(selector).to.be.eql({});
  });

  it('should apply sorting to query options', () => {
    let options: QueryOptions = {};
    filter.apply({}, options);

    expect(options).to.be.eql({
       sort: [{key: 'foo', order: SortingOrder.Ascending}]
    });
  });

  it('should be able to change sorting order', () => {
    let options: QueryOptions = {};
    filter.order = SortingOrder.Descending;
    filter.apply({}, options);

    expect(options).to.be.eql({
       sort: [{key: 'foo', order: SortingOrder.Descending}]
    });
  });

  it('should be able to change sorting key', () => {
    let options: QueryOptions = {};
    filter.key = 'bar'
    filter.apply({}, options);

    expect(options).to.be.eql({
       sort: [{key: 'bar', order: SortingOrder.Descending}]
    });
  });

  it('should be able to apply more sorting filters', () => {
    let filter2 = new SortingFilter({
      key: 'other',
      order: SortingOrder.Ascending
    }, view);

    let options: QueryOptions = {};
    filter.apply({}, options);
    filter2.apply({}, options);

    expect(options).to.be.eql({
       sort: [
         {key: 'bar', order: SortingOrder.Descending},
         {key: 'other', order: SortingOrder.Ascending}
       ]
    });
  });
});
