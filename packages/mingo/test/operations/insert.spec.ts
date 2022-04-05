import 'mingo/init/basic';
import {InsertOneWriter, ChangeSet} from '@tashmet/tashmet';
import {MingoStore} from '../../src/store';
import {expect} from 'chai';
import * as chai from 'chai';
import * as sinon from 'sinon';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import 'mocha';

chai.use(chaiAsPromised)
chai.use(sinonChai);

const sandbox = sinon.createSandbox();
const store = new MingoStore<any>({db: 'tashmet', coll: 'test'});


describe('InsertOneWriter', () => {
  let writer: InsertOneWriter<any>;
  let writeSpy: sinon.SinonSpy<[cs: ChangeSet<any>], Promise<void>>;

  before(() => {
    writer = new InsertOneWriter<any>(store);
  });

  beforeEach(() => {
    writeSpy = sandbox.spy(store, 'write');
  });

  afterEach(() => {
    sandbox.restore();
    store.documents = [];
  });

  it('should return correct result on success', () => {
    return expect(writer.execute({document: {_id: 1}}))
      .to.eventually.eql({insertedCount: 1, insertedIds: [1]});
  });

  it('should write correct change set to store', async () => {
    await writer.execute({document: {_id: 1}});
    const cs = writeSpy.getCall(0).args[0];
    expect(cs.incoming).to.eql([{_id: 1}]);
    expect(cs.outgoing).to.eql([]);
  });

  it('should throw when store throws', () => {
    store.documents = [{_id: 1}]
    return expect(writer.execute({document: {_id: 1}}))
      .to.eventually.throw;
  });

  it('should emit change document on success', (done) => {
    store.on('change', ({operationType, fullDocument}) => {
      expect(operationType).to.eql('insert');
      expect(fullDocument).to.eql({_id: 1});
      done();
    });
    expect(writer.execute({document: {_id: 1}}));
  });
});
