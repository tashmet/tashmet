import {TransformerService} from '../../../src/transformation/transformer';
import {number} from '../../../src/transformation/decorators';
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
    const ts = new TransformerService([]);
    let obj = new MultipleOf();

    it('should fail validation of a number that is not a multiple of given value', () => {
      obj.foo = 15;
      expect(ts.validate(obj)).to.eventually.have.lengthOf(1);
    });

    it('should pass validation of a number that is a multiple of given value', () => {
      obj.foo = 20;
      expect(ts.validate(obj)).to.eventually.have.lengthOf(0);
    });
  });
});