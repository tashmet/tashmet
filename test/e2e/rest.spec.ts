import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import Tashmit, {Collection, Document, LogLevel, provider, StorageEngine, Store, StoreConfig} from '../../packages/tashmit/dist'
import HttpClient from '../../packages/http-client/dist';
import MemoryClient from '../../packages/memory/dist';
import Caching from '../../packages/caching/dist';
// import {socket} from '../../packages/socket/dist';
import operators from '../../packages/operators/system';
import fetch from 'isomorphic-fetch';

chai.use(chaiAsPromised);

@provider({
  key: StorageEngine,
  inject: [HttpClient]
})
class RestClientStorageEngine implements StorageEngine {
  public constructor(private http: HttpClient) {}

  public createStore<TSchema extends Document>(config: StoreConfig): Store<TSchema> {
    return this.http.createApi<any>({
      path: `http://localhost:8000/api/${config.ns.coll}`,
      ...config
    })
  }
}

describe('rest', () => {
  let col: Collection

  before(async () => {
    const tashmit = await Tashmit
      .configure({logLevel: LogLevel.None})
      .use(HttpClient, {fetch})
      .use(MemoryClient, {operators})
      .use(Caching, {})
      .provide(RestClientStorageEngine)
      .connect();

    col = tashmit
      .db('testdb')
      .collection('test');
  });

  beforeEach(async () => {
    await col.insertMany([
      {_id: '1', item: { category: 'cake', type: 'chiffon' }, amount: 10 },
      {_id: '2', item: { category: 'cookies', type: 'chocolate chip'}, amount: 50 },
      {_id: '3', item: { category: 'cookies', type: 'chocolate chip'}, amount: 15 },
      {_id: '4', item: { category: 'cake', type: 'lemon' }, amount: 30 },
      {_id: '5', item: { category: 'cake', type: 'carrot' }, amount: 20 },
    ]);
  });

  afterEach(async () => {
    // col.removeAllListeners();
    await col.deleteMany({});
  });

  describe('insertOne', () => {
    it('should add a single document and give it an id', async () => {
      let doc = {item: { category: 'brownies', type: 'blondie' }, amount: 10 };
      const result = await col.insertOne(doc)
      expect(result.acknowledged).to.be.true;
      expect(doc).to.haveOwnProperty('_id');
      expect((doc as any)._id).to.eql(result.insertedId);
    });
    it('should throw when trying to insert a document with already existing ID', () => {
      return expect(col.insertOne(
        {_id: '1', item: { category: 'brownies', type: 'blondie' }, amount: 10 }
      )).to.eventually.be.rejected;
    });
    /*
    it('should emit a change event', (done) => {
      col.on('change', ({action, data}) => {
        expect(action).to.eql('insert');
        expect(data.length).to.eql(1);
        expect(data[0]).to.eql({_id: '6', item: { category: 'brownies', type: 'blondie' }, amount: 10 });
        done();
      });
      col.insertOne(
        {_id: '6', item: { category: 'brownies', type: 'blondie' }, amount: 10 }
      );
    });
    */
  });

  describe('insertMany', () => {
    it('should add a multiple documents and give them ids', async () => {
      const result = await col.insertMany([
        {item: { category: 'brownies', type: 'blondie' }, amount: 10 },
        {item: { category: 'brownies', type: 'baked' }, amount: 12 },
      ]);
      expect(result.acknowledged).to.be.true;
      expect(result.insertedCount).to.eql(2);
    });
    it('should throw when trying to insert a document with already existing ID', () => {
      return expect(col.insertMany([
        {item: { category: 'brownies', type: 'blondie' }, amount: 10 },
        {_id: '1', item: { category: 'brownies', type: 'baked' }, amount: 12 },
      ])).to.eventually.be.rejected;
    });
    /*
    it('should emit a change event for each document', async () => {
      const docs: any[] = [];
      col.on('change', ({data}) => {
        docs.push(data[0]);
      });
      await col.insertMany([
        {item: { category: 'brownies', type: 'blondie' }, amount: 10 },
        {item: { category: 'brownies', type: 'baked' }, amount: 12 },
      ]);
      return expect(docs.length).to.eql(2);
    });
    */
  });

  describe('replaceOne', () => {
    it('should update a single document', async () => {
      const result = await col.replaceOne(
        {_id: '1'}, {item: { category: 'brownies', type: 'blondie' }, amount: 20 }
      );
      expect(result).to.eql({
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 1,
        upsertedCount: 0,
        upsertedId: undefined,
      });
    });
    it('should have zero matchedCount and modifiedCount if no document matched selector', async () => {
      const result = await col.replaceOne(
        {_id: '6'}, {item: { category: 'brownies', type: 'blondie' }, amount: 20 }
      );
      expect(result).to.eql({
        acknowledged: true,
        matchedCount: 0,
        modifiedCount: 0,
        upsertedCount: 0,
        upsertedId: undefined,
      });
    });
    it('should completely replace document', async () => {
      await col.replaceOne(
        {_id: '1'}, { amount: 20 }
      );
      const doc = await col.findOne({_id: '1'});
      expect(doc.item).to.eql(undefined);
    });
    it('should upsert when specified', async () => {
      const result = await col.replaceOne(
        {_id: '6'}, { amount: 20 }, {upsert: true}
      );
      expect(result.upsertedCount).to.eql(1);
      expect(result.upsertedId).to.not.eql(undefined);
    });
    /*
    it('should emit a change event', (done) => {
      col.on('change', ({action, data}) => {
        expect(action).to.eql('replace');
        expect(data[0]).to.eql({_id: '1', item: { category: 'cake', type: 'chiffon' }, amount: 10 });
        expect(data[1]).to.eql({_id: '1', item: { category: 'brownies', type: 'blondie' }, amount: 20 });
        done();
      });
      col.replaceOne(
        {_id: '1'}, {item: { category: 'brownies', type: 'blondie' }, amount: 20 }
      );
    });
    */
  });

  describe('count', () => {
    it('should return 0 when no documents are matching', () => {
      expect(col.find({'item.category': 'candy'}).count()).to.eventually.eql(0);
    });
    it('should be a positive number when items are matched', async () => {
      expect(col.find({'item.category': 'cake'}).count()).to.eventually.eql(3);
    });
  });

  describe('aggregate', () => {
    it('should group by category', async () => {
      const pipeline = [
        {$group: {_id: "$item.category", count: { $sum: 1 } } }
      ];
      expect(await col.aggregate(pipeline).toArray()).to.eql([
        {_id: 'cake', count: 3},
        {_id: 'cookies', count: 2 }
      ]);
    });
    it('should do filtering, sorting and projection', async () => {
      const pipeline = [
        {$match: {'item.category': 'cake'}},
        {$sort: {amount: -1}},
        {$project: {_id: 0, 'item.type': 1}},
      ];
      expect(await col.aggregate(pipeline).toArray()).to.eql([
        {item: {type: 'lemon' }},
        {item: {type: 'carrot' }},
        {item: {type: 'chiffon' }},
      ]);
    });
  });

  describe('findOne', () => {
    it('should return null when document is not found', () => {
      return expect(col.findOne({_id: '7'})).to.eventually.eql(null);
    });
    it('should return the document when found', async () => {
      const doc = await col.findOne({_id: '1'});
      expect(doc).to.haveOwnProperty('amount').equals(10);
    });
  });

  describe('find', () => {
    it('should return empty list when no documents match selector', () => {
      return expect(col.find({_id: '7'}).toArray()).to.eventually.be.empty;
    });
    it('should return a list of matched documents', async () => {
      const docs = await col.find({'item.type': 'chiffon'}).toArray();
      expect(docs).to.have.length(1);
      expect(docs[0]).to.haveOwnProperty('_id').equal('1');
    });
    it('should handle query operators', async () => {
      const docs = await col.find({_id: {$in: ['1', '2', '7']}}).toArray();
      expect(docs).to.have.length(2);
    });
    it('should do sorting with key', async () => {
      const docs = await col.find().sort('amount', 1).toArray();
      expect(docs[0].item.type).to.eql('chiffon');
    });
    it('should do sorting with map', async () => {
      const docs = await col.find().sort({'item.category': 1, 'item.type': 1}).toArray();
      expect(docs[0].item.type).to.eql('carrot');
    });
    it('should do sorting with array', async () => {
      const docs = await col.find().sort(['item.category', 'item.type'], 1).toArray();
      expect(docs[0].item.type).to.eql('carrot');
    });
    it('should do offset and limiting', async () => {
      const docs = await col.find().sort('amount', -1).skip(1).limit(1).toArray();
      expect(docs).to.have.length(1);
      expect(docs[0].item.type).to.eql('lemon');
    });
    it('should accept query options', async () => {
      const docs = await col.find({}, {sort: {amount: -1}, skip: 1, limit: 1}).toArray();
      expect(docs).to.have.length(1);
      expect(docs[0].item.type).to.eql('lemon');
    });
    it('should be able to iterate', async () => {
      const cursor = col.find().sort('amount', -1).skip(1).limit(1);
      expect(await cursor.hasNext()).to.be.true;
      expect((await cursor.next()).item.type).to.eql('lemon');
      expect(await cursor.hasNext()).to.be.false;
      expect(await cursor.next()).to.eql(null);
    });
  });

  describe('deleteOne', () => {
    it('should return zero deletedCount when no document match selector', () => {
      return expect(col.deleteOne({_id: '7'}))
        .to.eventually.eql({acknowledged: true, deletedCount: 0});
    });
    it('should return non-zero deletedCount when document matches selector', async () => {
      return expect(col.deleteOne({_id: '1'}))
        .to.eventually.eql({acknowledged: true, deletedCount: 1});
    });
    it('should have removed selected document', async () => {
      await col.deleteOne({_id: '1'});
      return expect(col.findOne({_id: '1'})).to.eventually.be.null;
    });
    /*
    it('should emit a change event if a document was removed', (done) => {
      col.on('change', ({action, data}) => {
        expect(action).to.eql('delete');
        expect(data.length).to.eql(1);
        expect(data[0]).to.eql({_id: '1', item: { category: 'cake', type: 'chiffon' }, amount: 10 });
        done();
      });
      col.deleteOne({_id: '1'});
    });
    */
  });

  describe('deleteMany', () => {
    it('should return zero deletedCount when no document match selector', () => {
      return expect(col.deleteMany({_id: '7'}))
        .to.eventually.eql({acknowledged: true, deletedCount: 0});
    });
    it('should return non-zero deletedCount when documents match selector', async () => {
      return expect(col.deleteMany({'item.category': 'cookies'}))
        .to.eventually.eql({acknowledged: true, deletedCount: 2});
    });
    it('should have removed selected documents', async () => {
      await col.deleteMany({'item.category': 'cookies'});
      return expect(col.find({'item.category': 'cookies'}).count()).to.eventually.eql(0);
    });
    it('should not remove other documents', async () => {
      await col.deleteMany({'item.category': 'cookies'});
      return expect(col.find().count()).to.eventually.eql(3);
    });
    /*
    it('should emit a change event for each removed document', async () => {
      const docs: any[] = [];
      col.on('change', ({data}) => {
        docs.push(data[0]);
      });
      const res = await col.deleteMany({'item.category': 'cookies'});
      return expect(res.deletedCount).to.eql(docs.length);
    });
    */
  });
});
