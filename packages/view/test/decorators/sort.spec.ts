import {SortingDirection} from '@ziqquratu/database';
import {Op} from '../../src/decorators/operator';
import {expect} from 'chai';
import 'mocha';
import { QueryBuilder } from '../../src/query';


describe('SortBy', () => {
  it('should apply sorting to query options', async () => {
    class TestQuery extends QueryBuilder {
      @Op.$sort('foo')
      sort = SortingDirection.Ascending;
    }

    expect(new TestQuery().toPipeline()).to.eql([
      {$sort: {foo: SortingDirection.Ascending}}
    ]);
  });

  it('should not apply sorting when value is undefined', async () => {
    class TestQuery extends QueryBuilder {
      @Op.$sort('foo')
      sort = undefined
    }

    expect(new TestQuery().toPipeline()).to.eql([]);
  });
});
