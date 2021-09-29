import {SortingDirection} from '@ziqquratu/database';
import {expect} from 'chai';
import 'mocha';
import {ViewAggregator} from '../../src/aggregator';
import * as Op from '../../src/decorators/operator';

describe('Operator', () => {
  it('should apply single operator', async () => {
    class TestAggregator extends ViewAggregator {
      @Op.$eq() foo: string = 'bar';
    }

    const pipeline = new TestAggregator().pipeline;
    expect(pipeline).to.eql([
      {$match: {foo: {$eq: 'bar'}}}
    ]);
  });

  it('should apply multiple operators in the same step', async () => {
    class TestAggregator extends ViewAggregator {
      @Op.$gte('foo') min = 3;
      @Op.$lte('foo') max = 7;

      @Op.$sort('foo')
      fooSort = SortingDirection.Ascending;

      @Op.$sort('bar')
      barSort = SortingDirection.Descending;
    }

    const pipeline = new TestAggregator().pipeline;
    expect(pipeline).to.eql([
      {$match: {foo: {$gte: 3, $lte: 7}}},
      {$sort: {
        foo: SortingDirection.Ascending,
        bar: SortingDirection.Descending,
      }}
    ]);
  });
});
