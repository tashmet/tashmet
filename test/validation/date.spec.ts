import {ValidatorService} from '../../src/validation/validator';
import {date} from '../../src/validation/decorators';
import {expect} from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';

chai.use(chaiAsPromised);

describe('date', () => {
  class DateModel {
    @date()
    public foo: any;
  }
  const vs = new ValidatorService();
  let obj = new DateModel();

  it('should fail validation of a value that is a date string', () => {
    obj.foo = '2017-09-04T19:21:51.700Z';
    expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
  });

  it('should pass validation of a value that is a date', () => {
    obj.foo = new Date();
    expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
  });
});