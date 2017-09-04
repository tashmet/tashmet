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

    @model('test.MaxLength')
    class MaxLength {
      @string({maxLength: 5})
      public foo: string;
    }
    const ts = new TransformerService([MaxLength]);

    it('should fail validation of a string with longer length', () => {
      const plain = {foo: 'too long', _model: 'test.MaxLength'};

      expect(ts.toInstance(plain, 'persist')).to.be.rejected;
    });

    it('should pass validation of a string with equal length', () => {
      const plain = {foo: 'right', _model: 'test.MaxLength'};

      return ts.toInstance(plain, 'persist').then((obj: MaxLength) => {
        expect(obj.foo).to.eql('right');
      });
    });
  });

  describe('formats', () => {
    describe('email', () => {

      @model('test.Email')
      class Email {
        @string({format: 'email'})
        public foo: string;
      }
      const ts = new TransformerService([Email]);

      it('should fail validation of a string that is not a valid email address', () => {
        const plain = {foo: 'Not an email', _model: 'test.Email'};

        expect(ts.toInstance(plain, 'persist')).to.be.rejected;
      });

      it('should pass validation of a string that is a valid email address', () => {
        const plain = {foo: 'john.doe@example.com', _model: 'test.Email'};

        return ts.toInstance(plain, 'persist').then((obj: Email) => {
          expect(obj.foo).to.eql('john.doe@example.com');
        });
      });
    });
  });
});