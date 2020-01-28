import {SortingOrder} from '@ziqquratu/database';
import {SortByAnnotation} from '../../src/decorators/sort';
import {Cursor} from '../../src/query';
import {expect} from 'chai';
import 'mocha';

describe('SortBy', () => {
  it('should apply sorting to query options', () => {
    const cursor = new Cursor();
    new SortByAnnotation('foo').apply(cursor, SortingOrder.Ascending);

    expect(cursor.options).to.be.eql({
       sort: {foo: SortingOrder.Ascending}
    });
  });

  it('should be able to apply more sorting filters', () => {
    const cursor = new Cursor();
    new SortByAnnotation('foo').apply(cursor, SortingOrder.Descending);
    new SortByAnnotation('bar').apply(cursor, SortingOrder.Ascending);

    expect(cursor.options).to.be.eql({
       sort: {
         foo: SortingOrder.Descending,
         bar: SortingOrder.Ascending
       }
    });
  });

  it('should not apply sorting when value is undefined', () => {
    const cursor = new Cursor();
    new SortByAnnotation('foo').apply(cursor, undefined);

    expect(cursor.options).to.be.eql({});
  });
});
