import {TransformerService} from '../../../src/transformation/transformer';
import {array} from '../../../src/transformation/decorators';
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
  const ts = new TransformerService([]);
  let obj = new Array();

  it('should fail validation of value that is not an array', () => {
    obj.foo = {"Not": "an array"};
    expect(ts.validate(obj)).to.eventually.have.lengthOf(1);
  });

  it('should pass validation of a value that is an array', () => {
    obj.foo = [1, 2, 3, 4, 5];
    expect(ts.validate(obj)).to.eventually.have.lengthOf(0);
  });

  it('should pass validation of a value that is an array of different types', () => {
    obj.foo = [3, "different", { "types" : "of values" }];
    expect(ts.validate(obj)).to.eventually.have.lengthOf(0);
  });
});
