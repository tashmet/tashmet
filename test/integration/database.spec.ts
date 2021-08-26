import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import {
  bootstrap, component, Database, memory
} from '../../packages/ziqquratu/dist';

chai.use(chaiAsPromised);

describe('database', () => {
  @component({
    providers: [
      Database.configuration({
        collections: {
          'test': memory({documents: [{name: 'doc1'}, {name: 'doc2'}]})
        }
      })
    ],
    inject: [Database]
  })
  class TestComponent {
    public constructor(public database: Database) {}
  }

  let db: Database;

  before(async () => {
    db = (await bootstrap(TestComponent)).database;
  });

  it('should have registered collection in configuration', async () => {
    const collection = await db.collection('test');
    expect(collection.find().count()).to.eventually.eql(2);
  });

  it('should fail to aquire a collection that does not exist', () => {
    return expect(() => db.collection('noSuchCollection'))
      .to.throw("no collection named 'noSuchCollection' exists in database");
  });

  it('should fail to create collection with existing name', () => {
    return expect(() => db.createCollection('test', memory()))
      .to.throw("a collection named 'test' already exists in database");
  });

  describe('event', () => {
    it('should be emitted when a document is upserted', (done) => {
      db.on('document-upserted', (doc, collection) => {
        expect(doc.name).to.eql('doc3');
        expect(collection.name).to.eql('test');
        done();
      });
      db.collection('test').then(c => c.insertOne({name: 'doc3'}));
    });

    it('should be emitted when a document is removed', (done) => {
      db.on('document-removed', (doc, collection) => {
        expect(doc.name).to.eql('doc3');
        expect(collection.name).to.eql('test');
        done();
      });
      db.collection('test').then(c => c.deleteOne({name: 'doc3'}));
    });
  });
});
