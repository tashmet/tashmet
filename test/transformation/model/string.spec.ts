import {TransformerService} from '../../../src/transformation/transformer';
import {model, string} from '../../../src/transformation/decorators';
import {expect} from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';

chai.use(chaiAsPromised);

describe('string', () => {
  describe('minLength', () => {

    @model('test.MinLength')
    class MinLength {
      @string({minLength: 10})
      public foo: string;
    }
    const ts = new TransformerService([MinLength]);

    it('should fail validation of a string with shorter length', () => {
      const plain = {foo: 'too short', _model: 'test.MinLength'};

      expect(ts.toInstance(plain, 'persist')).to.be.rejected;
    });

    it('should pass validation of a string with equal length', () => {
      const plain = {foo: 'long enough', _model: 'test.MinLength'};

      return ts.toInstance(plain, 'persist').then((obj: MinLength) => {
        expect(obj.foo).to.eql('long enough');
      });
    });
  });
  
  describe('maxLength', () => {

    @model('test.MinLength')
    class MaxLength {
      @string({maxLength: 5})
      public foo: string;
    }
    const ts = new TransformerService([MaxLength]);

    it('should fail validation of a string with longer length', () => {
      const plain = {foo: 'too long', _model: 'test.MinLength'};

      expect(ts.toInstance(plain, 'persist')).to.be.rejected;
    });

    it('should pass validation of a string with equal length', () => {
      const plain = {foo: 'right', _model: 'test.MinLength'};

      return ts.toInstance(plain, 'persist').then((obj: MaxLength) => {
        expect(obj.foo).to.eql('right');
      });
    });
  });
});