import {SortingDirection} from '@ziqquratu/database';
import {Op} from '../../src/decorators/operator';
import {Aggregator} from '../../src/aggregator';
import {expect} from 'chai';
import 'mocha';


describe('SortBy', () => {
  it('should apply sorting to query options', async () => {
    class TestAggregator extends Aggregator {
      @Op.$sort('foo')
      sort = SortingDirection.Ascending;
    }

    expect(new TestAggregator().pipeline).to.eql([
      {$sort: {foo: SortingDirection.Ascending}}
    ]);
  });

  it('should not apply sorting when value is undefined', async () => {
    class TestAggregator extends Aggregator {
      @Op.$sort('foo')
      sort = undefined
    }

    expect(new TestAggregator().pipeline).to.eql([]);
  });
});
