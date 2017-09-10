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
    obj.foo = '2017-09-08T18:49:20.700Z';
    return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
  });

  it('should pass validation of a value that is a date', () => {
    obj.foo = new Date();
    return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
  });


  describe('range', () => {
    class DateRange {
      @date({
        min: new Date('2017-09-08T18:00:00.700Z'),
        max: new Date('2017-09-08T19:00:00.700Z')
      })
      public foo: Date;
    }
    const vs = new ValidatorService();
    let obj = new DateRange();

    it('should fail validation of a date before minimum', () => {
      obj.foo = new Date('2017-09-08T17:00:00.700Z')
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });

    it('should fail validation of a date after maximum', () => {
      obj.foo = new Date('2017-09-08T20:00:00.700Z')
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(1);
    });

    it('should pass validation of a date equal to minimum', () => {
      obj.foo = new Date('2017-09-08T18:00:00.700Z')
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
    });

    it('should pass validation of a date equal to maximum', () => {
      obj.foo = new Date('2017-09-08T19:00:00.700Z')
      return expect(vs.validate(obj)).to.eventually.have.lengthOf(0);
    });
  });
});