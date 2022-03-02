import {DefaultLogger} from '@tashmit/core/src/logging/logger';
import {SortingDirection} from '@tashmit/database';
import operators from '@tashmit/operators/system';
import {MemoryDatabase} from '../src/database';
import {expect} from 'chai';
import 'mocha';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {SimpleValidatorFactory} from '../dist/validator';

chai.use(chaiAsPromised);

describe('MemoryCollection', () => {
  interface Item {
    category: string;
    type: string;
  }

  interface ItemEntry {
    _id?: number | string;
    item: Item;
    amount: number;
  }

  const db = new MemoryDatabase(
    'testdb', new DefaultLogger(), new SimpleValidatorFactory(), operators);

  const col = db.collection('test');

  beforeEach(async () => {
    await col.insertMany([
      {_id: 1, item: { category: 'cake', type: 'chiffon' }, amount: 10 },
      {_id: 2, item: { category: 'cookies', type: 'chocolate chip'}, amount: 50 },
      {_id: 3, item: { category: 'cookies', type: 'chocolate chip'}, amount: 15 },
      {_id: 4, item: { category: 'cake', type: 'lemon' }, amount: 30 },
      {_id: 5, item: { category: 'cake', type: 'carrot' }, amount: 20 },
    ]);
  });

  afterEach(async () => {
    await col.deleteMany({});
  });

  describe('insertOne', () => {
    it('should add a single document and give it an id', async () => {
      const result = await col.insertOne(
        {item: { category: 'brownies', type: 'blondie' }, amount: 10 }
      );
      expect(result.acknowledged).to.be.true;
    });
    it('should throw when trying to insert a document with already existing ID', () => {
      return expect(col.insertOne(
        {_id: 1, item: { category: 'brownies', type: 'blondie' }, amount: 10 }
      )).to.eventually.be.rejected;
    });
    it('should emit a change event', (done) => {
      const cs = col.watch();
      cs.on('change', ({operationType, fullDocument}) => {
        expect(operationType).to.eql('insert');
        expect(fullDocument).to.eql({_id: 6, item: { category: 'brownies', type: 'blondie' }, amount: 10 });
        cs.close();
        done();
      });
      col.insertOne(
        {_id: 6, item: { category: 'brownies', type: 'blondie' }, amount: 10 }
      );
    });
  });

  describe('insertMany', () => {
    it('should add multiple documents and give them ids', async () => {
      const docs = [
        {item: { category: 'brownies', type: 'blondie' }, amount: 10 },
        {item: { category: 'brownies', type: 'baked' }, amount: 12 },
      ];
      const result = await col.insertMany(docs);
      expect(result.acknowledged).to.be.true;
      expect(result.insertedCount).to.eql(2);
      expect(result.insertedIds[0]).to.eql((docs[0] as any)._id);
      expect(result.insertedIds[1]).to.eql((docs[1] as any)._id);
    });
    it('should throw when trying to insert a document with already existing ID', () => {
      return expect(col.insertMany([
        {item: { category: 'brownies', type: 'blondie' }, amount: 10 },
        {_id: 1, item: { category: 'brownies', type: 'baked' }, amount: 12 },
      ])).to.eventually.be.rejected;
    });
    it('should emit multiple change events', async () => {
      const cs = col.watch();
      await col.insertMany([
        {item: { category: 'brownies', type: 'blondie' }, amount: 10 },
        {item: { category: 'brownies', type: 'baked' }, amount: 12 },
      ]);
      expect(cs.hasNext()).to.be.true;
      expect(cs.next()?.operationType).to.eql('insert');
      expect(cs.hasNext()).to.be.true;
      expect(cs.next()?.operationType).to.eql('insert');
      expect(cs.hasNext()).to.be.false;
      cs.close();
    });
  });

  describe('replaceOne', () => {
    it('should update a single document', async () => {
      const result = await col.replaceOne(
        {_id: 1}, {item: { category: 'brownies', type: 'blondie' }, amount: 20 }
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
        {_id: 6}, {item: { category: 'brownies', type: 'blondie' }, amount: 20 }
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
        {_id: 1}, {item: { category: 'cake', type: 'chiffon' }, amount: 20 }
      );
      const doc = await col.findOne({_id: 1});
      expect(doc?.amount).to.eql(20);
    });
    it('should upsert when specified', async () => {
      const result = await col.replaceOne(
        {_id: 6}, {item: { category: 'cake', type: 'chiffon' }, amount: 20 }, {upsert: true}
      );
      expect(result.upsertedCount).to.eql(1);
      expect(result.upsertedId).to.not.eql(undefined);
    });
    it('should emit a change event', (done) => {
      const cs = col.watch();
      cs.on('change', ({operationType, documentKey, fullDocument}) => {
        expect(operationType).to.eql('replace');
        expect(documentKey).to.eql(1)
        expect(fullDocument).to.eql({item: { category: 'brownies', type: 'blondie' }, amount: 20, _id: 1});
        cs.close();
        done();
      });
      col.replaceOne(
        {_id: 1}, {item: { category: 'brownies', type: 'blondie' }, amount: 20 }
      );
    });
  });

  describe('updateOne', () => {
    it('should update a single document', async () => {
      const result = await col.updateOne(
        {_id: 1}, {$set: {amount: 25} }
      );
      expect(result).to.eql({
        acknowledged: true,
        matchedCount: 1,
        modifiedCount: 1,
        upsertedCount: 0,
        upsertedId: undefined,
      });
    });
    it('should have modified the document', async () => {
      await col.updateOne({_id: 1}, {$set: {amount: 25} });
      const doc = await col.findOne({_id: 1});
      expect(doc).to.eql({_id: 1, item: { category: 'cake', type: 'chiffon' }, amount: 25 });
    })
  })

  describe('count', () => {
    it('should return 0 when no documents are matching', () => {
      return expect(col.find({'item.category': 'candy'}).count()).to.eventually.eql(0);
    });
    it('should be a positive number when items are matched', async () => {
      return expect(col.find({'item.category': 'cake'}).count()).to.eventually.eql(3);
    });
  });

  describe('distinct', () => {
    it('should return list of distinct values', () => {
      return expect(col.distinct('item.category')).to.eventually.eql(['cake', 'cookies']);
    });
    it('should return list of distinct values with filter', () => {
      return expect(col.distinct('item.type', {amount: {$gte: 30}}))
        .to.eventually.eql(['chocolate chip', 'lemon']);
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
        {$sort: {amount: SortingDirection.Descending}},
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
      return expect(col.findOne({_id: 7})).to.eventually.eql(null);
    });
    it('should return the document when found', async () => {
      const doc = await col.findOne({_id: 1});
      expect(doc).to.haveOwnProperty('amount').equals(10);
    });
  });

  describe('find', () => {
    it('should return empty list when no documents match selector', () => {
      return expect(col.find({_id: 7}).toArray()).to.eventually.be.empty;
    });
    it('should return a list of matched documents', async () => {
      const docs = await col.find({'item.type': 'chiffon'}).toArray();
      expect(docs).to.have.length(1);
      expect(docs[0]).to.haveOwnProperty('_id').equal(1);
    });
    it('should handle query operators', async () => {
      const docs = await col.find({_id: {$in: [1, 2, 7]}}).toArray();
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
    it('should do projection', async () => {
      const docs = await col.find({_id: 1}, {projection: {_id: 0, amount: 1}}).limit(1).toArray();
      expect(docs[0]).to.eql({amount: 10});
    });
    it('should be able to sort on excluded field', async () => {
      const docs = await col.find({}, {projection: {amount: 0}, sort: {amount: 1}}).toArray();
      expect(docs.map(d => d._id)).to.eql([1, 3, 5, 4, 2]);
    });
    it('should accept query options', async () => {
      const docs = await col.find({}, {sort: {amount: -1}, skip: 1, limit: 1}).toArray();
      expect(docs).to.have.length(1);
      expect(docs[0].item.type).to.eql('lemon');
    });
    it('should be able to iterate', async () => {
      const cursor = col.find().sort('amount', -1).skip(1).limit(1);
      expect(await cursor.hasNext()).to.be.true;
      expect((await cursor.next())?.item?.type).to.eql('lemon');
      expect(await cursor.hasNext()).to.be.false;
      expect(await cursor.next()).to.eql(null);
    });
  });

  describe('deleteOne', () => {
    it('should return zero deletedCount when no document match selector', () => {
      return expect(col.deleteOne({_id: 7}))
        .to.eventually.eql({acknowledged: true, deletedCount: 0});
    });
    it('should return non-zero deletedCount when document matches selector', async () => {
      return expect(col.deleteOne({_id: 1}))
        .to.eventually.eql({acknowledged: true, deletedCount: 1});
    });
    it('should have removed selected document', async () => {
      await col.deleteOne({_id: 1});
      return expect(col.findOne({_id: 1})).to.eventually.be.null;
    });
    it('should emit a change event if a document was removed', (done) => {
      const cs = col.watch();
      cs.on('change', ({operationType, documentKey}) => {
        expect(operationType).to.eql('delete');
        expect(documentKey).to.eql(1);
        cs.close();
        done();
      });
      col.deleteOne({_id: 1});
    });
  });

  describe('deleteMany', () => {
    it('should return zero deletedCount when no document match selector', () => {
      return expect(col.deleteMany({_id: 7}))
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
    it('should emit a change event', async () => {
      const cs = col.watch();
      await col.deleteMany({'item.category': 'cookies'});
      expect(cs.hasNext()).to.be.true;
      expect(cs.next()?.operationType).to.eql('delete');
      expect(cs.hasNext()).to.be.true;
      expect(cs.next()?.operationType).to.eql('delete');
      expect(cs.hasNext()).to.be.false;
      cs.close();
    });
  });
});
