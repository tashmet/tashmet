import {ValidatorService} from '../../src/validation/validator';
import {number} from '../../src/validation/decorators';
import {expect} from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';

chai.use(chaiAsPromised);

describe('number', () => {
  class Number {
    @number()
    public foo: any;
  }
  const vs = new ValidatorService();
  let obj = new Number();

  it('should fail validation of a value that is not numeric', () => {
    obj.foo = '432';
    return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
  });

  it('should pass validation of a value that is numeric', () => {
    obj.foo = 432;
    return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
  });

  it('should pass validation of a number that is floating point', () => {
    obj.foo = 5.2;
    return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
  });

  it('should pass validation of a number with exponential notation', () => {
    obj.foo = 2.99792458e8;
    return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
  });


  describe('multipleOf', () => {
    class MultipleOf {
      @number({multipleOf: 10})
      public foo: number;
    }
    const vs = new ValidatorService();
    let obj = new MultipleOf();

    it('should fail validation of a number that is not a multiple of given value', () => {
      obj.foo = 15;
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });

    it('should pass validation of a number that is a multiple of given value', () => {
      obj.foo = 20;
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
    });
  });

  describe('minimum', () => {
    class Minimum {
      @number({minimum: 2.7})
      public foo: number;
    }
    const vs = new ValidatorService();
    let obj = new Minimum();

    it('should fail validation of a number that is lower than minimum', () => {
      obj.foo = 2.6;
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });

    it('should pass validation of a number that is equal to minimum', () => {
      obj.foo = 2.7;
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
    });
  });

  describe('maximum', () => {
    class Maximum {
      @number({maximum: 2.7})
      public foo: number;
    }
    const vs = new ValidatorService();
    let obj = new Maximum();

    it('should fail validation of a number that is higher than maximum', () => {
      obj.foo = 2.8;
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });

    it('should pass validation of a number that is equal to maximum', () => {
      obj.foo = 2.7;
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
    });
  });
});