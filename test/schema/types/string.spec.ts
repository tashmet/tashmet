import {ValidatorService} from '../../../src/schema/validator';
import {string} from '../../../src/schema/decorators';
import {expect} from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';

chai.use(chaiAsPromised);

describe('string', () => {
  const vs = new ValidatorService();

  class String {
    @string()
    public foo: any;
  }
  let obj = new String();

  it('should pass validation of a string', () => {
    obj.foo = 'This is a string';
    return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
  });

  it('should fail validation of a number', () => {
    obj.foo = 72;
    return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
  });

  describe('minLength', () => {
    class MinLength {
      @string({minLength: 10})
      public foo: string;
    }
    let obj = new MinLength();

    it('should fail validation of a string with shorter length', () => {
      obj.foo = 'too short';
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });

    it('should pass validation of a string with equal length', () => {
      obj.foo = 'long enough';
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
    });
  });

  describe('maxLength', () => {
    class MaxLength {
      @string({maxLength: 5})
      public foo: string;
    }
    let obj = new MaxLength();

    it('should fail validation of a string with longer length', () => {
      obj.foo = 'too long';
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });

    it('should pass validation of a string with equal length', () => {
      obj.foo = 'right';
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
    });
  });

  describe('formats', () => {
    describe('date-time', () => {
      class DateTime {
        @string({format: 'date-time'})
        public foo: string;
      }
      let obj = new DateTime();

      it('should fail validation of a string that is not a valid date', () => {
        obj.foo = 'not a date';
        return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
      });

      it('should pass validation of a string that is a valid date', () => {
        obj.foo = '2017-09-04T19:21:51.700Z';
        return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
      });
    });

    describe('email', () => {
      class Email {
        @string({format: 'email'})
        public foo: string;
      }
      let obj = new Email();

      it('should fail validation of a string that is not a valid email address', () => {
        obj.foo = 'not an email address';
        return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
      });

      it('should pass validation of a string that is a valid email address', () => {
        obj.foo = 'john.doe@example.com';
        return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
      });
    });

    describe('ipv4', () => {
      class IPv4 {
        @string({format: 'ipv4'})
        public foo: string;
      }
      let obj = new IPv4();

      it('should fail validation of a string that is not a valid IPv4 address', () => {
        obj.foo = '545.34.2.4';
        return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
      });

      it('should pass validation of a string that is a valid IPv4 address', () => {
        obj.foo = '127.0.0.1';
        return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
      });
    });

    describe('ipv6', () => {
      class IPv6 {
        @string({format: 'ipv6'})
        public foo: string;
      }
      let obj = new IPv6();

      it('should fail validation of a string that is not a valid IPv6 address', () => {
        obj.foo = '127.0.0.1';
        return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
      });

      it('should pass validation of a string that is a valid IPv6 address', () => {
        obj.foo = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
        return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
      });
    });
  });
});