import {expect} from 'chai';
import 'mocha';
import {QueryBuilder} from '../../src/query';
import {Op} from '../../src/decorators/operator';

describe('Operator', () => {
  it('should apply single operator', async () => {
    class TestQuery extends QueryBuilder {
      @Op.$eq() foo: string = 'bar';
    }

    const pipeline = new TestQuery().toPipeline();
    expect(pipeline).to.eql([
      {$match: {foo: {$eq: 'bar'}}}
    ]);
  });

  it('should apply multiple operators on the same key', async () => {
    class TestQuery extends QueryBuilder {
      @Op.$gte('foo') min = 3;
      @Op.$lte('foo') max = 7;
    }

    const pipeline = new TestQuery().toPipeline();
    expect(pipeline).to.eql([
      {$match: {foo: {$gte: 3, $lte: 7}}}
    ]);
  });
});
