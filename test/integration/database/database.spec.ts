import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import Tashmet, {Database} from '../../../packages/tashmet'
import Mingo from '../../../packages/mingo'
import 'mingo/init/system';

chai.use(chaiAsPromised);

describe('database', () => {

  let db: Database;

  before(async () => {
    const tashmet = await Tashmet
      .configure()
      .use(Mingo, {})
      .connect();
    db = tashmet.db('testdb');
    db.collection('test');
  });

    /*
  it('should have registered collection in configuration', async () => {
    const collection = db.collection('test');
    expect(collection.find().count()).to.eventually.eql(2);
  });
  */

  it('should create a collection if it does not exist', () => {
    expect(db.collection('noSuchCollection').collectionName).to.eql('noSuchCollection')
  });

  it('should fail to create collection with existing name', () => {
    return expect(() => db.createCollection('test', {}))
      .to.throw("a collection named 'test' already exists in database");
  });
/*
  describe('event', () => {
    afterEach(() => {
      db.removeAllListeners();
    })

    it('should be emitted when a document is upserted', (done) => {
      db.on('change', ({action, data, collection}) => {
        expect(action).to.eql('insert');
        expect(data[0].name).to.eql('doc3');
        expect(collection.name).to.eql('test');
        done();
      });
      db.collection('test').insertOne({name: 'doc3'});
    });

    it('should be emitted when a document is removed', (done) => {
      db.on('change', ({action, data, collection}) => {
        expect(action).to.eql('delete');
        expect(data[0].name).to.eql('doc2');
        expect(collection.name).to.eql('test');
        done();
      });
      db.collection('test').deleteOne({name: 'doc2'});
    });
  });
  */
});
