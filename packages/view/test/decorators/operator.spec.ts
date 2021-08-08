import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import 'mocha';
import {makeSelector} from '../../src/query';
import {Operator} from '../../src/decorators/operator';

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('Operator', () => {
  it('should apply single operator', async () => {
    class TestQuery {
      @Operator.eq() foo: string = 'bar'
    }

    const selector = makeSelector(new TestQuery());
    expect(selector.value).to.eql({foo: {$eq: 'bar'}});
  });

  it('should apply multiple operators on the same key', async () => {
    class TestQuery {
      @Operator.gte({key: 'foo'}) min: number = 3
      @Operator.lte({key: 'foo'}) max: number = 7
    }

    const selector = makeSelector(new TestQuery());
    expect(selector.value).to.eql({foo: {$gte: 3, $lte: 7}});
  });
});
