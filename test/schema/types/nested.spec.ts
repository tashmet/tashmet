import {ValidatorService} from '../../../src/schema/validator';
import {nested, integer} from '../../../src/schema/decorators';
import {expect} from 'chai';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import 'mocha';

chai.use(chaiAsPromised);

describe('nested', () => {
  class Child {
    @integer()
    public bar: number;
  }

  class Parent {
    @nested(Child)
    public foo: Child;
  }
  const vs = new ValidatorService();
  let parent = new Parent();
  let child = new Child();
  parent.foo = child;

  it('should pass validation of parent when child passes validation', () => {
    child.bar = 1;
    return expect(vs.validate(parent)).to.eventually.have.lengthOf(0);
  });

  it('should fail validation of parent when child fails validation', () => {
    child.bar = 3.14;
    return expect(vs.validate(parent)).to.eventually.have.lengthOf(1);
  });
});
