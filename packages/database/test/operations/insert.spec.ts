import {InsertOneWriter} from '../../dist/operations/insert';
import {MemoryDriver} from '../../dist/collections/memory';
import {expect} from 'chai';
import * as chai from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import 'mocha';
import { ChangeSet } from '../../dist';

chai.use(sinonChai);

const sandbox = sinon.createSandbox();
const driver = new MemoryDriver<any>({db: 'tashmit', coll: 'test'});


describe('InsertOneWriter', () => {
  let writer: InsertOneWriter<any>;
  let writeSpy: sinon.SinonSpy<[cs: ChangeSet<any>], Promise<void>>;

  before(() => {
    writer = new InsertOneWriter<any>(driver);
  });

  beforeEach(() => {
    writeSpy = sandbox.spy(driver, 'write');
  });

  afterEach(() => {
    sandbox.restore();
    driver.documents = [];
  });

  it('should return correct result on success', () => {
    return expect(writer.execute({document: {_id: 1}}))
      .to.eventually.eql({insertedCount: 1, insertedIds: [1]});
  });

  it('should write correct change set to driver', async () => {
    await writer.execute({document: {_id: 1}});
    const cs = writeSpy.getCall(0).args[0];
    expect(cs.incoming).to.eql([{_id: 1}]);
    expect(cs.outgoing).to.eql([]);
  });

  it('should throw when driver throws', () => {
    driver.documents = [{_id: 1}]
    return expect(writer.execute({document: {_id: 1}}))
      .to.eventually.throw;
  });

  it('should emit change document on success', (done) => {
    driver.on('change', ({operationType, fullDocument}) => {
      expect(operationType).to.eql('insert');
      expect(fullDocument).to.eql({_id: 1});
      done();
    });
    expect(writer.execute({document: {_id: 1}}));
  });
});
