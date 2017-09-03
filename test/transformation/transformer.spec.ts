import {TransformerService} from '../../src/transformation/transformer';
import {model, string} from '../../src/transformation/decorators';
import {expect} from 'chai';
import 'mocha';

describe('TransformerService', () => {
  describe('toInstance', () => {

    @model('test.TestModel')
    class TestModel {
      @string({})
      public foo: string;
    }

    const ts = new TransformerService([TestModel]);

    it('should transform a plain object', () => {
      const plain = {foo: 'bar', _model: 'test.TestModel'};

      return ts.toInstance(plain, 'persist').then((obj: TestModel) => {
        expect(obj.foo).to.eql('bar');
      });
    });
  });
});
