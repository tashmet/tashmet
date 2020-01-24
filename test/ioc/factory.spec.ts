import {BasicContainer, Factory, Provider} from '../../packages/ziqquratu';
import {expect} from 'chai';
import 'mocha';

describe('Factory', () => {
  const container = new BasicContainer();

  class MyFactory extends Factory<string> {
    public constructor(private ending: string) {
      super('recipient');
    }

    public create(message: string): string {
      return this.resolve((recipient: string) => {
        return message + ' ' + recipient + this.ending;
      });
    }
  }

  it('should register', () => {
    expect(() => {
      container.register(Provider.ofInstance('recipient', 'world'));
    }).to.not.throw();
  });

  it('should throw if factory was not registered', () => {
    const fact = new MyFactory('!');
    expect(() => fact.create('hello')).to.throw();
  });

  it('should create an instance', () => {
    const fact = new MyFactory('!');
    MyFactory.container = container;
    expect(fact.create('hello')).to.eql('hello world!');
  });
});
