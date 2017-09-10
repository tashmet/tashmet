import {ValidatorService} from '../../src/validation/validator';
import {boolean} from '../../src/validation/decorators';
import {expect} from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';

chai.use(chaiAsPromised);

describe('boolean', () => {
  class Boolean {
    @boolean()
    public foo: any;
  }
  const vs = new ValidatorService();
  let obj = new Boolean();

  it('should pass validation of a value that is true', () => {
    obj.foo = true
    return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
  });

  it('should pass validation of a value that is false', () => {
    obj.foo = false
    return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
  });

  it('should fail validation of a value that is not a boolean', () => {
    obj.foo = 'true';
    return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
  });

  it('should fail validation of a value that is not a boolean but evaluates to one', () => {
    obj.foo = 0;
    return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
  });
});