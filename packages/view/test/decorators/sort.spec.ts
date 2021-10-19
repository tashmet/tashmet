import {sort} from '../../src/decorators/operator';
import {ViewAggregator} from '../../src/aggregator';
import {expect} from 'chai';
import 'mocha';

describe('SortBy', () => {
  it('should apply sorting with key', async () => {
    class TestAggregator extends ViewAggregator {
      @sort('foo') sort = 1
    }

    expect(new TestAggregator().pipeline).to.eql([
      {$sort: {foo: 1}}
    ]);
  });

  it('should apply sorting without key', async () => {
    class TestAggregator extends ViewAggregator {
      @sort() sort = {foo: 1}
    }

    expect(new TestAggregator().pipeline).to.eql([
      {$sort: {foo: 1}}
    ]);
  });

  it('should not apply sorting when value is undefined', async () => {
    class TestAggregator extends ViewAggregator {
      @sort('foo') sort = undefined
    }

    expect(new TestAggregator().pipeline).to.eql([]);
  });

  it('should not apply sorting without key when value is undefined', async () => {
    class TestAggregator extends ViewAggregator {
      @sort() sort = undefined
    }

    expect(new TestAggregator().pipeline).to.eql([]);
  });
});
