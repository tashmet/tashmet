import {TransformerService} from '../../../src/transformation/transformer';
import {integer} from '../../../src/transformation/decorators';
import {expect} from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';

chai.use(chaiAsPromised);

describe('integer', () => {
  class Integer {
    @integer({})
    public foo: number;
  }
  const ts = new TransformerService([]);
  let obj = new Integer();

  it('should fail validation of a number that is not an integer', () => {
    obj.foo = 3.1415926;
    expect(ts.validate(obj)).to.eventually.have.lengthOf(1);
  });

  it('should pass validation of a number that is an integer', () => {
    obj.foo = 5;
    expect(ts.validate(obj)).to.eventually.have.lengthOf(0);
  });
});