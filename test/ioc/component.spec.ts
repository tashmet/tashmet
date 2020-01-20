import {bootstrap, component, provider, Provider} from '../../packages/ziqquratu';
import {expect} from 'chai';
import 'mocha';

describe('component', () => {
  describe('without providers', () => {
    @component()
    class TestComponent {}

    it('should bootstrap an empty component', async () => {
      return expect(
        await bootstrap(TestComponent)
      ).to.be.instanceof(TestComponent);
    });
  });

  describe('with providers', () => {
    @provider()
    class TestProvider {}

    @component({
      providers: [TestProvider],
      inject: [TestProvider]
    })
    class TestComponent {
      constructor(
        public testProvider: TestProvider
      ) {}
    }

    it('should register providers', async () => {
      return expect(
        (await bootstrap(TestComponent)).testProvider
      ).to.be.instanceOf(TestProvider);
    });
  });

  describe('with instances', () => {
    @component({
      providers: [
        Provider.ofInstance('foo', 'bar')
      ],
      inject: ['foo']
    })
    class TestComponent {
      constructor(
        public foo: string
      ) {}
    }

    it('should register instances', async () => {
      return expect(
        (await bootstrap(TestComponent)).foo
      ).to.eql('bar');
    });
  });
});
