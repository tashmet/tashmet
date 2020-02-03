import {MemoryCollection, SortingDirection} from '@ziqquratu/database';
import {SortByAnnotation} from '../../src/decorators/sort';
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
    const cursor = collection.find();
    const sortSpy = sandbox.spy(cursor, 'sort');
    new SortByAnnotation('foo').apply(cursor, SortingDirection.Ascending);

    expect(sortSpy).to.have.been.calledWith('foo', SortingDirection.Ascending);
  });

  it('should not apply sorting when value is undefined', async () => {
    const cursor = collection.find();
    const sortSpy = sandbox.spy(cursor, 'sort');
    new SortByAnnotation('foo').apply(cursor, undefined);

    expect(sortSpy).to.not.have.been.called;
  });
});
