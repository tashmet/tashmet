import {ValidatorService} from '../../src/validation/validator';
import {number} from '../../src/validation/decorators';
import {expect} from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';

chai.use(chaiAsPromised);

describe('number', () => {
  describe('multipleOf', () => {
    class MultipleOf {
      @number({multipleOf: 10})
      public foo: number;
    }
    const vs = new ValidatorService();
    let obj = new MultipleOf();

    it('should fail validation of a number that is not a multiple of given value', () => {
      obj.foo = 15;
      expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });

    it('should pass validation of a number that is a multiple of given value', () => {
      obj.foo = 20;
      expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
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
      expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });

    it('should pass validation of a number that is equal to minimum', () => {
      obj.foo = 2.7;
      expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
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
      expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });

    it('should pass validation of a number that is equal to maximum', () => {
      obj.foo = 2.7;
      expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
    });
  });
});