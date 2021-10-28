import {SortingDirection} from '@tashmit/database';
import {expect} from 'chai';
import 'mocha';
import {ViewAggregator} from '../../dist/aggregator';
import {match, sort} from '../../dist/decorators/operator';

describe('match', () => {
  it('should apply dynamic filter', async () => {
    class TestAggregator extends ViewAggregator {
      @match.lte() foo: number = 12;

      get pipeline() {
        return this.compile(({foo}) => [
          foo,
          {$match: {foo: {$gte: 4}}},
        ]);
      }
    }

    const pipeline = new TestAggregator().pipeline;
    expect(pipeline).to.eql([
      {$match: {foo: {$lte: 12, $gte: 4}}},
    ]);
  });

  it('should apply single operator', async () => {
    class TestAggregator extends ViewAggregator {
      @match.eq() foo: string = 'bar';
    }

    const pipeline = new TestAggregator().pipeline;
    expect(pipeline).to.eql([
      {$match: {foo: {$eq: 'bar'}}}
    ]);
  });

  it('should apply multiple operators in the same step', async () => {
    class TestAggregator extends ViewAggregator {
      @match.gte('foo') min = 3;
      @match.lte('foo') max = 7;

      @sort('foo') fooSort = 1;
      @sort('bar') barSort = -1
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
