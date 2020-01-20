import {Annotation} from '../src/annotation';
import {classDecorator, parameterDecorator, propertyDecorator} from '../src/decoration';
import {expect} from 'chai';
import 'mocha';

describe('annotation', () => {
  describe('on class', () => {
    class TestAnnotation extends Annotation {
      public constructor(
        public foo: number,
        public bar: number,
        public target: any
      ) { super(); }
    }

    const testDecorator = (foo: number, bar: number) =>
      classDecorator(target => new TestAnnotation(foo, bar, target));

    @testDecorator(1, 2)
    class Base {}

    class Derived extends Base {}

    it('should not exist on undecorated class', () => {
      class Undecorated {}
      expect(TestAnnotation.existsOnClass(Undecorated)).to.be.false;
    });
    it('should exist on decorated class', () => {
      expect(TestAnnotation.existsOnClass(Base)).to.be.true;
    });
    it('should have one instance', () => {
      expect(TestAnnotation.onClass(Base)).to.have.lengthOf(1);
    });
    it('should not exist directly on derived class', () => {
      expect(TestAnnotation.existsOnClass(Derived)).to.be.false;
    });
    it('should exist indirectly on derived class', () => {
      expect(TestAnnotation.existsOnClass(Derived, true)).to.be.true;
    });
    it('should exist indirectly on derived class', () => {
      expect(TestAnnotation.existsOnClass(Derived, true)).to.be.true;
    });
    it('should get arguments in constructor', () => {
      expect(TestAnnotation.onClass(Base)[0].foo).to.eql(1);
      expect(TestAnnotation.onClass(Base)[0].bar).to.eql(2);
    });
    it('should get target class in constructor', () => {
      expect(TestAnnotation.onClass(Derived, true)[0].target).to.eql(Base);
    });
  });

  describe('on property', () => {
    class PropertyAnnotation extends Annotation {
      public constructor(public propertyKey: string) { super(); }
    }

    const propDec = () => propertyDecorator((target, propertyKey) =>
      new PropertyAnnotation(propertyKey));

    class Test {
      @propDec()
      public decorated = '';
    }

    it('should exist on class', () => {
      expect(PropertyAnnotation.existsOnClass(Test)).to.be.true;
    });
    it('should be accessible on class', () => {
      expect(PropertyAnnotation.onClass(Test).length).to.eql(1);
    });
    it('should exist on decorated method', () => {
      expect(PropertyAnnotation.onProperty(Test, 'decorated').length).to.eql(1);
    });
    it('should have correct property key', () => {
      expect(PropertyAnnotation.onProperty(Test, 'decorated')[0].propertyKey).to.eql('decorated');
    });
    it('should have correct property key', () => {
      expect(PropertyAnnotation.onProperty(Test, 'decorated')[0].propertyKey).to.eql('decorated');
    });
  });

  describe('on parameter', () => {
    class ParamAnnotation extends Annotation {
      public constructor(public propertyKey: string, public index: number) { super(); }
    }

    const paramDec = () => parameterDecorator((target, propertyKey, parameterIndex) =>
      new ParamAnnotation(propertyKey, parameterIndex));

    class Test {
      public constructor(@paramDec() public arg: string) {}

      public decorated(
        p0: string,
        @paramDec() p1: string,
        p2: string,
        @paramDec() p3: string,
      ) { return; }

      public undecorated(p0: string) { return; }
    }

    it('should exist on decorated constructor', () => {
      expect(ParamAnnotation.onParameters(Test).length).to.eql(1);
    });
    it('should not exist on undecorated method', () => {
      expect(ParamAnnotation.onParameters(Test, 'undecorated').length).to.eql(0);
    });
    it('should exist on decorated method', () => {
      expect(ParamAnnotation.onParameters(Test, 'decorated').length).to.eql(2);
    });
    it('should have correct property key', () => {
      expect(ParamAnnotation.onParameters(Test, 'decorated')[0].propertyKey).to.eql('decorated');
    });
    it('should have correct index', () => {
      expect(ParamAnnotation.onParameters(Test, 'decorated')[0].index).to.eql(1);
      expect(ParamAnnotation.onParameters(Test, 'decorated')[1].index).to.eql(3);
    });
  });
});
