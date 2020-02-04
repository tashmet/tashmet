import {MemoryCollection} from '../../src/collections/memory';
import {expect} from 'chai';
import 'mocha';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe('MemoryCollection', () => {
  const col = new MemoryCollection('test');

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
      const doc = await col.insertOne(
        {item: { category: 'brownies', type: 'blondie' }, amount: 10 }
      );
      expect(doc.amount).to.eql(10);
      expect(doc).to.haveOwnProperty('_id');
    });
    it('should throw when trying to insert a document with already existing ID', () => {
      return expect(col.insertOne(
        {_id: 1, item: { category: 'brownies', type: 'blondie' }, amount: 10 }
      )).to.eventually.be.rejected;
    });
  });

  describe('replaceOne', () => {
    it('should update a single document', async () => {
      const doc = await col.replaceOne(
        {_id: 1}, {item: { category: 'brownies', type: 'blondie' }, amount: 20 }
      );
      expect(doc._id).to.eql(1);
      expect(doc.amount).to.eql(20);
    });
    it('should return null if no document matched selector', async () => {
      const doc = await col.replaceOne(
        {_id: 6}, {item: { category: 'brownies', type: 'blondie' }, amount: 20 }
      );
      expect(doc).to.eql(null);
    });
    it('should completely replace document', async () => {
      const doc = await col.replaceOne(
        {_id: 1}, { amount: 20 }
      );
      expect(doc.item).to.eql(undefined);
    });
    it('should upsert when specified', async () => {
      const doc = await col.replaceOne(
        {_id: 6}, { amount: 20 }, {upsert: true}
      );
      expect(doc.amount).to.eql(20);
    });
  });

  describe('count', () => {
    it('should return 0 when no documents are matching', () => {
      expect(col.find({'item.category': 'candy'}).count()).to.eventually.eql(0);
    });
    it('should be a positive number when items are matched', async () => {
      expect(col.find({'item.category': 'cake'}).count()).to.eventually.eql(3);
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
    it('should do sorting', async () => {
      const docs = await col.find().sort('item.category', 1).sort('item.type', 1).toArray();
      expect(docs[0].item.type).to.eql('carrot');
    });
    it('should do offset and limiting', async () => {
      const docs = await col.find().sort('amount', -1).skip(1).limit(1).toArray();
      expect(docs).to.have.length(1);
      expect(docs[0].item.type).to.eql('lemon');
    });
  });

  describe('remove', () => {
    it('should return empty list when no documents match selector', () => {
      return expect(col.deleteMany({_id: 7})).to.eventually.be.empty;
    });
    it('should return a list of deleted documents', async () => {
      const docs = await col.deleteMany({'item.category': 'cookies'});
      expect(docs).to.have.length(2);
    });
    it('should have removed selected documents', async () => {
      await col.deleteMany({'item.category': 'cookies'});
      return expect(col.find({'item.category': 'cookies'}).count()).to.eventually.eql(0);
    });
    it('should not remove other documents', async () => {
      await col.deleteMany({'item.category': 'cookies'});
      return expect(col.find().count()).to.eventually.eql(3);
    });
  });
});
