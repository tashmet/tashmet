import {MemoryCollection, SortingOrder} from '@ziqquratu/database';
import {SortByAnnotation} from '../../src/decorators/sort';
import {Cursor} from '../../src/query';
import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import 'mocha';

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('SortBy', () => {
  let sandbox: sinon.SinonSandbox;
  const collection = new MemoryCollection('test');

  beforeEach(async () => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should apply sorting to query options', async () => {
    const findSpy = sandbox.spy(collection, 'find');
    const cursor = new SortByAnnotation('foo').apply(new Cursor(collection), SortingOrder.Ascending);
    await cursor.all();

    expect(findSpy).to.be.calledWith({}, {
       sort: {foo: SortingOrder.Ascending}
    });
  });

  it('should be able to apply more sorting filters', async () => {
    const findSpy = sandbox.spy(collection, 'find');
    const c1 = new SortByAnnotation('foo').apply(new Cursor(collection), SortingOrder.Descending);
    const c2 = new SortByAnnotation('bar').apply(c1, SortingOrder.Ascending);
    c2.all();

    expect(findSpy).to.be.calledWith({}, {
       sort: {
         foo: SortingOrder.Descending,
         bar: SortingOrder.Ascending
       }
    });
  });

  it('should not apply sorting when value is undefined', async () => {
    const findSpy = sandbox.spy(collection, 'find');
    const cursor = new SortByAnnotation('foo').apply(new Cursor(collection), undefined);
    await cursor.all();

    expect(findSpy).to.be.calledWith({}, {});
  });
});
