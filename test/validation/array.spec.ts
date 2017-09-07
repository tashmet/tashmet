import {ValidatorService} from '../../src/validation/validator';
import {array} from '../../src/validation/decorators';
import {expect} from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';

chai.use(chaiAsPromised);

describe('array', () => {
  class Array {
    @array()
    public foo: any;
  }
  const vs = new ValidatorService();
  let obj = new Array();

  it('should fail validation of value that is not an array', () => {
    obj.foo = {"Not": "an array"};
    expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
  });

  it('should pass validation of a value that is an array', () => {
    obj.foo = [1, 2, 3, 4, 5];
    expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
  });

  it('should pass validation of a value that is an array of different types', () => {
    obj.foo = [3, "different", { "types" : "of values" }];
    expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
  });

  describe('length constraints', () => {
    class ArrayLength {
      @array({
        minItems: 2,
        maxItems: 3
      })
      public foo: any;
    }
    const vs = new ValidatorService();
    let obj = new ArrayLength();

    it('should fail validation of empty array', () => {
      obj.foo = [];
      expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });

    it('should fail validation of array below minimum length', () => {
      obj.foo = [1];
      expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });

    it('should pass validation of array with minimum length', () => {
      obj.foo = [1, 2];
      expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
    });

    it('should pass validation of array with maximum length', () => {
      obj.foo = [1, 2, 3];
      expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
    });

    it('should fail validation of array above maximum length', () => {
      obj.foo = [1, 2, 3, 4];
      expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });
  });
});
