import {Instance, Cache, Injection, Lazy, Lookup, Optional} from '../src';
import {BasicContainer} from '../src/container';
import {Provider} from '../src/provider';
import {expect} from 'chai';
import * as chai from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import 'mocha';

chai.use(sinonChai);

let sandbox = sinon.createSandbox();

describe('resolvers', () => {
  let container = new BasicContainer();

  before(() => {
    container.register(Provider.ofInstance('foo', 'instance'));
  });

  describe('Instance', () => {
    it('should resolve what was put into it', () => {
      expect(new Instance(432).resolve(container)).to.eql(432);
    });
  });

  describe('Cache', () => {
    let cache = Cache.of('foo');

    beforeEach(() => {
      sandbox.spy(container, 'resolve');
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should resolve by soliciting container first time', () => {
      expect(cache.resolve(container)).to.eql('instance');
    });
    it('should resolve cached instance in preceding calls', () => {
      expect(cache.resolve(container)).to.eql('instance');
      expect(container.resolve).to.not.have.been.called;
    });
  });

  describe('Injection', () => {
    describe('ofClass', () => {
      class Target {
        public constructor(public foo: string) {}
      }

      let injection = Injection.ofClass(Target, ['foo']);

      it('should resolve instance of class with dependencies injected', () => {
        let instance = injection.resolve(container);

        expect(instance).to.be.instanceOf(Target);
        expect(instance.foo).to.eql('instance');
      });
    });

    describe('of', () => {
      let injection = Injection.of((foo: string) => foo, ['foo']);

      it('should resolve by calling factory function with dependencies', () => {
        expect(injection.resolve(container)).to.eql('instance');
      });
    });
  });

  describe('Lazy', () => {
    let lazy = Lazy.of('foo');

    it('should resolve a function that resolves the service request', () => {
      expect(lazy.resolve(container)()).to.eql('instance');
    });
  });

  describe('Lookup', () => {
    it('should resolve a registered service identifier', () => {
      expect(Lookup.of('foo').resolve(container)).to.eql('instance');
    });
  });

  describe('Optional', () => {
    it('should resolve a registered service identifier', () => {
      expect(Optional.of('foo').resolve(container)).to.eql('instance');
    });
    it('should resolve "undefined" for an unregistered service identifier', () => {
      expect(Optional.of('bar').resolve(container)).to.eql(undefined);
    });
  });
});