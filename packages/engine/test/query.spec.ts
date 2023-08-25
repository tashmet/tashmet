import { Queryable, QueryCursor } from '../src/query';
import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import 'mocha';

chai.use(sinonChai);

const { expect } = chai;
const sandbox = sinon.createSandbox();

class MockQueryable implements Queryable {
  public executeQuery(collName: string, query: Document): Promise<Document[]> {
    return Promise.resolve([]);
  }
}

const queryable = new MockQueryable();
let spy: sinon.SinonSpy;

describe('QueryCursor', () => {
  beforeEach(() => {
      spy = sandbox.spy(queryable, 'executeQuery');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should apply default limit when no batch size is given', async () => {
    const cursor = new QueryCursor(queryable, 'test', {}, 1);
    await cursor.getBatch();

    expect(spy).to.have.been.calledWith('test', {skip: 0, limit: 1000});
  });

  it('should apply a limit equal to batch size', async () => {
    const cursor = new QueryCursor(queryable, 'test', {}, 1);
    await cursor.getBatch(10);

    expect(spy).to.have.been.calledWith('test', {skip: 0, limit: 10});
  });

  it('should apply a skip on second call', async () => {
    const cursor = new QueryCursor(queryable, 'test', {}, 1);
    await cursor.getBatch(10);
    await cursor.getBatch(10);

    expect(spy.callCount).to.eql(2);
    expect(spy.getCall(1)).to.have.been.calledWith('test', {skip: 10, limit: 10});
  });

  it('should handle initial limit', async () => {
    const cursor = new QueryCursor(queryable, 'test', {limit: 10}, 1);
    await cursor.getBatch(20);

    expect(spy).to.have.been.calledWith('test', {skip: 0, limit: 10});
  });

  it('should handle initial skip', async () => {
    const cursor = new QueryCursor(queryable, 'test', {skip: 10}, 1);
    await cursor.getBatch(20);

    expect(spy).to.have.been.calledWith('test', {skip: 10, limit: 20});
  });

  it('should handle initial skip and limit', async () => {
    const cursor = new QueryCursor(queryable, 'test', {skip: 10, limit: 10}, 1);
    await cursor.getBatch(20);

    expect(spy).to.have.been.calledWith('test', {skip: 10, limit: 10});
  });
});
