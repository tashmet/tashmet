import {UpdateWriter} from '../../dist/operations/update';
import {MemoryDriver} from '../../dist/collections/memory';
import {expect} from 'chai';
import * as chai from 'chai';
import * as sinon from 'sinon';
import sinonChai from 'sinon-chai';
import 'mocha';
import {ChangeSet} from '../../dist';

chai.use(sinonChai);

const sandbox = sinon.createSandbox();
const driver = new MemoryDriver<any>({db: 'tashmit', coll: 'test'});


describe('UpdateWriter', () => {
  let writer: UpdateWriter<any>;
  let writeSpy: sinon.SinonSpy<[cs: ChangeSet<any>], Promise<void>>;

  before(() => {
    writer = new UpdateWriter<any>(driver, false);
  });

  beforeEach(() => {
    writeSpy = sandbox.spy(driver, 'write');
    driver.documents = [{_id: 1}, {_id: 2}];
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return correct result when no document was updated', () => {
    return expect(writer.execute({filter: {_id: 3}, update: {$set: {foo: 'bar'}}}))
      .to.eventually.eql({matchedCount: 0, modifiedCount: 0});
  });

  it('should return correct result when a document was updated', () => {
    return expect(writer.execute({filter: {_id: 2}, update: {$set: {foo: 'bar'}}}))
      .to.eventually.eql({matchedCount: 1, modifiedCount: 1});
  });

  it('should write correct change set to driver', async () => {
    await writer.execute({filter: {_id: 1}, update: {$set: {foo: 'bar'}}});
    const cs = writeSpy.getCall(0).args[0];
    expect(cs.incoming).to.eql([{_id: 1, foo: 'bar'}]);
    expect(cs.outgoing).to.eql([{_id: 1}]);
  });

  it('should emit change document on success', (done) => {
    driver.on('change', ({operationType, fullDocument}) => {
      expect(operationType).to.eql('update');
      expect(fullDocument).to.eql({_id: 1, foo: 'bar'});
      done();
    });
    writer.execute({filter: {_id: 1}, update: {$set: {foo: 'bar'}}});
  });
});
