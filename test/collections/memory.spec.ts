import {MemoryCollection} from '../../src/collections/memory';
import {expect} from 'chai';
import 'mocha';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe('MemoryCollection', () => {
  let col = new MemoryCollection('test');

  beforeEach(async () => {
    await col.upsert({_id: 1, item: { category: 'cake', type: 'chiffon' }, amount: 10 });
    await col.upsert({_id: 2, item: { category: 'cookies', type: 'chocolate chip'}, amount: 50 });
    await col.upsert({_id: 3, item: { category: 'cookies', type: 'chocolate chip'}, amount: 15 });
    await col.upsert({_id: 4, item: { category: 'cake', type: 'lemon' }, amount: 30 });
    await col.upsert({_id: 5, item: { category: 'cake', type: 'carrot' }, amount: 20 });
  });

  afterEach(async () => {
    await col.remove({});
  });

  describe('upsert', () => {
    it('should add a single document and give it an id', async () => {
      const doc = await col.upsert(
        {item: { category: 'brownies', type: 'blondie' }, amount: 10 }
      );
      expect(doc.amount).to.eql(10);
      expect(doc).to.haveOwnProperty('_id');
    });
    it('should update a single document', async () => {
      const doc1 = await col.upsert(
        {item: { category: 'brownies', type: 'blondie' }, amount: 10 }
      );
      const doc2 = await col.upsert(
        {_id: doc1._id, item: { category: 'brownies', type: 'blondie' }, amount: 20 }
      );
      expect(doc1._id).to.eql(doc2._id);
      expect(doc1.amount).to.eql(10);
      expect(doc2.amount).to.eql(20);
    });
  });

  describe('count', () => {
    it('should return 0 when no documents are matching', () => {
      expect(col.count({'item.category': 'candy'})).to.eventually.eql(0);
    });
    it('should be a positive number when items are matched', async () => {
      expect(col.count({'item.category': 'cake'})).to.eventually.eql(3);
    });
  });

  describe('findOne', () => {
    it('should throw when document is not found', () => {
      return expect(col.findOne({_id: 7})).to.eventually.be.rejectedWith('');
    });
    it('should return the document when found', async () => {
      let doc = await col.findOne({_id: 1});
      expect(doc).to.haveOwnProperty('amount').equals(10);
    });
  });

  describe('find', () => {
    it('should return empty list when no documents match selector', () => {
      return expect(col.find({_id: 7})).to.eventually.be.empty;
    });
    it('should return a list of matched documents', async () => {
      const docs = await col.find({'item.type': 'chiffon'});
      expect(docs).to.have.length(1);
      expect(docs[0]).to.haveOwnProperty('_id').equal(1);
    });
    it('should handle query operators', async () => {
      const docs = await col.find({_id: {$in: [1, 2, 7]}});
      expect(docs).to.have.length(2);
    });
    it('should do sorting', async () => {
      const docs = await col.find({}, {sort: {'item.category': 1, 'item.type': 1}});
      expect(docs[0].item.type).to.eql('carrot');
    });
    it('should do offset and limiting', async () => {
      const docs = await col.find({}, {
        sort: {'amount': -1},
        offset: 1,
        limit: 1
      });
      expect(docs).to.have.length(1);
      expect(docs[0].item.type).to.eql('lemon');
    });
  });

  describe('remove', () => {
    it('should return empty list when no documents match selector', () => {
      return expect(col.remove({_id: 7})).to.eventually.be.empty;
    });
    it('should return a list of deleted documents', async () => {
      const docs = await col.remove({'item.category': 'cookies'});
      expect(docs).to.have.length(2);
    });
  });
});
