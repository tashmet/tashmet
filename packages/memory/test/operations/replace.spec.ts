import 'mingo/init/basic';
import {ReplaceOneWriter, ChangeSet} from '@tashmet/database';
import {MemoryStore} from '../../src/store';
import {expect} from 'chai';
import * as chai from 'chai';
import * as sinon from 'sinon';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import 'mocha';

chai.use(chaiAsPromised)
chai.use(sinonChai);

const sandbox = sinon.createSandbox();
const store = new MemoryStore<any>({db: 'tashmet', coll: 'test'});


describe('ReplaceOneWriter', () => {
  let writer: ReplaceOneWriter<any>;
  let writeSpy: sinon.SinonSpy<[cs: ChangeSet<any>], Promise<void>>;

  before(() => {
    writer = new ReplaceOneWriter<any>(store);
  });

  beforeEach(() => {
    writeSpy = sandbox.spy(store, 'write');
    store.documents = [{_id: 1}, {_id: 2}];
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should return correct result when no document was replaced', () => {
    return expect(writer.execute({filter: {_id: 3}, replacement: {foo: 'bar'}}))
      .to.eventually.eql({matchedCount: 0, modifiedCount: 0});
  });

  it('should return correct result when a document was replaced', () => {
    return expect(writer.execute({filter: {_id: 2}, replacement: {foo: 'bar'}}))
      .to.eventually.eql({matchedCount: 1, modifiedCount: 1});
  });

  it('should return correct result when a document was upserted', async () => {
    const result = await writer.execute({filter: {_id: 3}, replacement: {foo: 'bar'}, upsert: true});
    expect(result.matchedCount).to.eql(0);
    expect(result.modifiedCount).to.eql(0);
    expect(result.upsertedCount).to.eql(1);
    expect(result.upsertedIds).to.have.length(1);
  });

  it('should write correct change set to store', async () => {
    await writer.execute({filter: {_id: 1}, replacement: {foo: 'bar'}});
    const cs = writeSpy.getCall(0).args[0];
    expect(cs.incoming).to.eql([{_id: 1, foo: 'bar'}]);
    expect(cs.outgoing).to.eql([{_id: 1}]);
  });

  it('should emit change document on success', (done) => {
    store.on('change', ({operationType, fullDocument}) => {
      expect(operationType).to.eql('replace');
      expect(fullDocument).to.eql({_id: 1, foo: 'bar'});
      done();
    });
    expect(writer.execute({filter: {_id: 1}, replacement: {foo: 'bar'}}));
  });
});
