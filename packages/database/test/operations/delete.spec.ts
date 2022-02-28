import {DeleteWriter} from '../../dist/operations/delete';
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


describe('DeleteWriter', () => {
  let writer: DeleteWriter<any>;
  let writeSpy: sinon.SinonSpy<[cs: ChangeSet<any>], Promise<void>>;

  before(() => {
    writer = new DeleteWriter<any>(driver, false);
  });

  beforeEach(() => {
    writeSpy = sandbox.spy(driver, 'write');
    driver.documents = [{_id: 1}, {_id: 2}];
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return correct result when no document was removed', () => {
    return expect(writer.execute({filter: {_id: 3}}))
      .to.eventually.eql({deletedCount: 0});
  });

  it('should return correct result when a document was removed', () => {
    return expect(writer.execute({filter: {_id: 1}}))
      .to.eventually.eql({deletedCount: 1});
  });

  it('should write correct change set to driver', async () => {
    await writer.execute({filter: {_id: 1}});
    const cs = writeSpy.getCall(0).args[0];
    expect(cs.incoming).to.eql([]);
    expect(cs.outgoing).to.eql([{_id: 1}]);
  });

  it('should emit change document on success', (done) => {
    driver.on('change', ({operationType, fullDocument}) => {
      expect(operationType).to.eql('delete');
      expect(fullDocument).to.eql({_id: 1});
      done();
    });
    expect(writer.execute({filter: {_id: 1}}));
  });
});
