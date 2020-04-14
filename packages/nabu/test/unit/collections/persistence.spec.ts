import {Collection, MemoryCollection} from '@ziqquratu/ziqquratu';
import {DatabaseService} from '@ziqquratu/database/src/database';
import {DefaultLogger} from '@ziqquratu/core/src/logging/logger';
import {ObjectMap, PersistenceAdapter} from '../../../src/interfaces';
import {PersistenceCollection} from '../../../src/collections/persistence';
import {EventEmitter} from 'eventemitter3';
import {expect} from 'chai';
import 'mocha';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

chai.use(chaiAsPromised);
chai.use(sinonChai);

class MockPersistenceAdapter extends EventEmitter implements PersistenceAdapter {
  public read(): Promise<ObjectMap> {
    return Promise.resolve({});
  }

  public write(docs: any[]): Promise<void> {
    return Promise.resolve();
  }

  public remove(ids: string[]): Promise<void> {
    return Promise.resolve();
  }
}

describe('PersistenceCollection', () => {
  const cache = new MemoryCollection(
    'test', new DatabaseService({collections: {}}, new DefaultLogger())
  );
  const adapter = new MockPersistenceAdapter();
  let collection: Collection;

  const read = sinon.stub(adapter, 'read');
  const write = sinon.stub(adapter, 'write');

  before(async () => {
    read.returns(Promise.resolve({
      doc1: {},
      doc2: {}
    }));
    collection = await (new PersistenceCollection(adapter, cache).populate());
  });

  after(() => {
    read.restore();
    write.restore();
  });

  describe('find', () => {
    it('should find all documents', async () => {
      const docs = await collection.find().toArray();

      expect(docs).to.have.lengthOf(2);
      expect(docs[0]).to.have.property('_id', 'doc1');
      expect(docs[1]).to.have.property('_id', 'doc2');
    });

    it('should filter with selector', async () => {
      const docs = await collection.find({'_id': 'doc2'}).toArray();

      expect(docs).to.have.lengthOf(1);
      expect(docs[0]).to.have.property('_id', 'doc2');
    });
  });

  describe('insertOne', () => {
    it('should write to persistence adapter', async () => {
      await collection.insertOne({_id: 'doc3'});

      expect(write).to.have.been.calledWith([{_id: 'doc3'}]);
    });
  });
  
  describe('insertMany', () => {
    it('should write to persistence adapter', async () => {
      await collection.insertMany([{_id: 'doc4'}, {_id: 'doc5'}]);

      expect(write).to.have.been.calledWith([{_id: 'doc4'}, {_id: 'doc5'}]);
    });
  });

  describe('events', () => {
    describe('document-updated in persistence adapter', () => {
      it('should trigger document-upserted in collection', (done) => {
        collection.on('document-upserted', (doc: any) => {
          expect(doc._id).to.eql('doc1');
          done();
        });

        adapter.emit('document-updated', 'doc1', {});
      });
    });

    describe('document-removed in persistence adapter', () => {
      it('should trigger document-removed in collection', (done) => {
        collection.on('document-removed', (doc: any) => {
          expect(doc._id).to.eql('doc1');
          done();
        });

        adapter.emit('document-removed', 'doc1');
      });
    });
  });
});
