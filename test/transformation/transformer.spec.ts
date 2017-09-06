import {TransformerService} from '../../src/transformation/transformer';
import {model, expose} from '../../src/transformation/decorators';
import {expect} from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';

chai.use(chaiAsPromised);

describe('TransformerService', () => {
  describe('toInstance', () => {

    @model('test.TestModel')
    class TestModel {
      @expose()
      public foo: string;
    }

    const ts = new TransformerService([TestModel]);

    it('should fail to transform a plain object without _model property', () => {
      const plain = {foo: 'bar'};
      expect(ts.toInstance(plain, 'persist')).to.be.rejectedWith(Error);
    });

    it('should transform a plain object', () => {
      const plain = {foo: 'bar', _model: 'test.TestModel'};
      return ts.toInstance(plain, 'persist').then((obj: TestModel) => {
        expect(obj.foo).to.eql('bar');
      });
    });
  });
});
