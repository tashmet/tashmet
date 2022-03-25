import {BasicContainer, provider, Provider} from '../../../packages/tashmet';
import {expect} from 'chai';
import 'mocha';

describe('provider', () => {
  const container = new BasicContainer();

  describe('without annotation', () => {
    class ProviderWithoutAnnotation {}

    it('should register', () => {
      expect(() => {
        container.register(ProviderWithoutAnnotation);
      }).to.not.throw();
    });

    it('should resolve using class', () => {
      expect(container.resolve(ProviderWithoutAnnotation))
        .to.be.instanceOf(ProviderWithoutAnnotation);
    });
  });

  describe('without key', () => {
    @provider()
    class ProviderWithoutKey {}

    it('should register', () => {
      expect(() => {
        container.register(ProviderWithoutKey);
      }).to.not.throw();
    });

    it('should resolve using class', () => {
      expect(container.resolve(ProviderWithoutKey)).to.be.instanceOf(ProviderWithoutKey);
    });
  });

  describe('with key', () => {
    @provider({
      key: 'test.ProviderWithKey'
    })
    class ProviderWithKey {}

    it('should register', () => {
      expect(() => {
        container.register(ProviderWithKey);
      }).to.not.throw();
    });

    it('should resolve using class', () => {
      expect(container.resolve('test.ProviderWithKey')).to.be.instanceOf(ProviderWithKey);
    });
  });

  describe('with injection', () => {
    @provider({
      inject: ['foo']
    })
    class ProviderWithInjection {
      public constructor(public foo: string) {}
    }

    it('should register', () => {
      expect(() => {
        container.register(Provider.ofInstance('foo', 'bar'));
        container.register(ProviderWithInjection);
      }).to.not.throw();
    });

    it('should resolve instance with injected dependencies', () => {
      expect(container.resolve(ProviderWithInjection).foo).to.eql('bar');
    });
  });

  describe('in singleton scope', () => {
    @provider({
      key: 'test.SingletonProvider'
    })
    class SingletonProvider {}

    it('should register', () => {
      expect(() => {
        container.register(SingletonProvider);
      }).to.not.throw();
    });

    it('should only have a single instance', () => {
      const instance1 = container.resolve<SingletonProvider>('test.SingletonProvider');
      const instance2 = container.resolve<SingletonProvider>('test.SingletonProvider');

      expect(instance1).to.equal(instance2);
    });
  });

  describe('in transient scope', () => {
    @provider({
      key: 'test.TransientProvider',
      transient: true
    })
    class TransientProvider {}

    it('should register', () => {
      expect(() => {
        container.register(TransientProvider);
      }).to.not.throw();
    });

    it('should return instances for a registered name', () => {
      const instance1 = container.resolve<TransientProvider>('test.TransientProvider');
      const instance2 = container.resolve<TransientProvider>('test.TransientProvider');

      expect(instance1).to.not.equal(instance2);
    });
  });
});
