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
    describe('date-time', () => {

      @model('test.DateTime')
      class DateTime {
        @string({format: 'date-time'})
        public foo: string;
      }
      const ts = new TransformerService([DateTime]);

      it('should fail validation of a string that is not a valid date', () => {
        const plain = {foo: 'Not a date', _model: 'test.DateTime'};

        expect(ts.toInstance(plain, 'persist')).to.be.rejected;
      });

      it('should pass validation of a string that is a valid date', () => {
        const plain = {foo: '2017-09-04T19:21:51.700Z', _model: 'test.DateTime'};

        return ts.toInstance(plain, 'persist').then((obj: DateTime) => {
          expect(obj.foo).to.eql('2017-09-04T19:21:51.700Z');
        });
      });
    });

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

    describe('ipv4', () => {

      @model('test.IPv4')
      class IPv4 {
        @string({format: 'ipv4'})
        public foo: string;
      }
      const ts = new TransformerService([IPv4]);

      it('should fail validation of a string that is not a valid IPv4 address', () => {
        const plain = {foo: '545.34.2.4', _model: 'test.IPv4'};

        expect(ts.toInstance(plain, 'persist')).to.be.rejected;
      });

      it('should pass validation of a string that is a valid IPv4 address', () => {
        const plain = {foo: '127.0.0.1', _model: 'test.IPv4'};

        return ts.toInstance(plain, 'persist').then((obj: IPv4) => {
          expect(obj.foo).to.eql('127.0.0.1');
        });
      });
    });

    describe('ipv6', () => {

      @model('test.IPv6')
      class IPv6 {
        @string({format: 'ipv6'})
        public foo: string;
      }
      const ts = new TransformerService([IPv6]);

      it('should fail validation of a string that is not a valid IPv6 address', () => {
        const plain = {foo: '127.0.0.1', _model: 'test.IPv6'};

        expect(ts.toInstance(plain, 'persist')).to.be.rejected;
      });

      it('should pass validation of a string that is a valid IPv6 address', () => {
        const plain = {foo: '2001:0db8:85a3:0000:0000:8a2e:0370:7334', _model: 'test.IPv6'};

        return ts.toInstance(plain, 'persist').then((obj: IPv6) => {
          expect(obj.foo).to.eql('2001:0db8:85a3:0000:0000:8a2e:0370:7334');
        });
      });
    });
  });
});