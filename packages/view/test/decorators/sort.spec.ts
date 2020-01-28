import {SortingOrder} from '@ziqquratu/database';
import {SortByAnnotation} from '../../src/decorators/sort';
import {Cursor} from '../../src/query';
import {expect} from 'chai';
import 'mocha';

describe('SortBy', () => {
  it('should apply sorting to query options', () => {
    const cursor = new SortByAnnotation('foo').apply(new Cursor(), SortingOrder.Ascending);

    expect(cursor.options).to.be.eql({
       sort: {foo: SortingOrder.Ascending}
    });
  });

  it('should be able to apply more sorting filters', () => {
    const c1 = new SortByAnnotation('foo').apply(new Cursor(), SortingOrder.Descending);
    const c2 = new SortByAnnotation('bar').apply(c1, SortingOrder.Ascending);

    expect(c2.options).to.be.eql({
       sort: {
         foo: SortingOrder.Descending,
         bar: SortingOrder.Ascending
       }
    });
  });

  it('should not apply sorting when value is undefined', () => {
    const cursor = new SortByAnnotation('foo').apply(new Cursor(), undefined);

    expect(cursor.options).to.be.eql({});
  });
});
