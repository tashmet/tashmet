import {ValidatorService} from '../../../src/schema/validator';
import {array, string} from '../../../src/schema/decorators';
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
    return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
  });

  it('should pass validation of a value that is an array', () => {
    obj.foo = [1, 2, 3, 4, 5];
    return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
  });

  it('should pass validation of a value that is an array of different types', () => {
    obj.foo = [3, "different", { "types" : "of values" }];
    return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
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
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });

    it('should fail validation of array below minimum length', () => {
      obj.foo = [1];
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });

    it('should pass validation of array with minimum length', () => {
      obj.foo = [1, 2];
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
    });

    it('should pass validation of array with maximum length', () => {
      obj.foo = [1, 2, 3];
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
    });

    it('should fail validation of array above maximum length', () => {
      obj.foo = [1, 2, 3, 4];
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });
  });

  describe('uniqueness', () => {
    class ArrayUniqueness {
      @array({uniqueItems: true})
      public foo: any;
    }
    const vs = new ValidatorService();
    let obj = new ArrayUniqueness();

    it('should pass validation of array with unique items', () => {
      obj.foo = [1, 2, 3, 4, 5];
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
    });

    it('should fail validation of array with duplicates', () => {
      obj.foo = [1, 2, 3, 3, 4];
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });

    it('should pass validation of empty array', () => {
      obj.foo = [];
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
    });
  });

  describe('item type', () => {
    class ArrayItemType {
      @array({
        items: {
          type: string()
        }
      })
      public foo: any;
    }
    const vs = new ValidatorService();
    let obj = new ArrayItemType();

    it('should pass validation of array with items of specified type', () => {
      obj.foo = ['1', '2'];
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
    });

    it('should fail validation of array with items of other type', () => {
      obj.foo = [1, 2];
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });
  });
});
