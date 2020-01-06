import {SortingOrder, QueryOptions} from '../../../../src/interfaces';
import {SortBy} from '../../../../src/view/decorators/sort';
import {expect} from 'chai';
import 'mocha';

describe('SortBy', () => {
  it('should apply sorting to query options', () => {
    let options: QueryOptions = {};
    new SortBy('foo').modifyOptions(SortingOrder.Ascending, '', options);

    expect(options).to.be.eql({
       sort: {foo: SortingOrder.Ascending}
    });
  });

  it('should be able to apply more sorting filters', () => {
    let options: QueryOptions = {};
    new SortBy('foo').modifyOptions(SortingOrder.Descending, '', options);
    new SortBy('bar').modifyOptions(SortingOrder.Ascending, '', options);

    expect(options).to.be.eql({
       sort: {
         foo: SortingOrder.Descending,
         bar: SortingOrder.Ascending
       }
    });
  });

  it('should not apply sorting when value is undefined', () => {
    let options: QueryOptions = {};
    new SortBy('foo').modifyOptions(undefined, '', options);

    expect(options).to.be.eql({
       sort: {}
    });
  });
});
