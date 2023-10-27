import Tashmet, { Collection } from '../../../packages/tashmet/dist/index.js';
import Nabu from '../../../packages/nabu/dist/index.js';
import mingo from '../../../packages/mingo/stream/dist/index.js';
import 'mocha';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import fsExtra from 'fs-extra';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const { expect } = chai;

function storedDoc(id: string | number): any {
  return fsExtra.readJsonSync(`test/e2e/testCollection/${id}.json`);
}

function storedFiles(): string[] {
  return fsExtra.readdirSync('test/e2e/testCollection');
}

describe('fileStorage', () => {
  let col: Collection<any>;

  before(async () => {
    const store = Nabu
      .configure({
        defaultIO: 'json'
      })
      .io('json', ns => Nabu
        .json()
        .directory(`test/${ns.db}/${ns.collection}`)
      )
      .use(mingo())
      .bootstrap();

    const client = await Tashmet.connect(store.proxy());

    col = await client.db('e2e').createCollection('testCollection');
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
    //col.removeAllListeners();
    await col.deleteMany({});
  });

  after(() => {
    fsExtra.rmdirSync('test/e2e/testCollection');
  });

  describe('insertOne', () => {
    it('should add a single document and give it an id', async () => {
      const doc = {item: { category: 'brownies', type: 'blondie' }, amount: 10 };
      const result = await col.insertOne(doc);
      expect(result.acknowledged).to.be.true
      expect(doc).to.haveOwnProperty('_id');
      const id = (doc as any)._id;
      expect(await storedDoc(id))
        .to.eql({_id: id, item: { category: 'brownies', type: 'blondie' }, amount: 10 });
    });
    it('should throw when trying to insert a document with already existing ID', () => {
      expect(col.insertOne(
        {_id: '1', item: { category: 'brownies', type: 'blondie' }, amount: 10 }
      )).to.eventually.be.rejected;
      expect(storedDoc('1'))
        .to.eql({_id: '1', item: { category: 'cake', type: 'chiffon' }, amount: 10 });
    });
    /*
    it('should emit a change event', (done) => {
      col.on('change', ({action, data}) => {
        expect(action).to.eql('insert');
        expect(data.length).to.eql(1);
        expect(data[0]).to.eql({_id: 6, item: { category: 'brownies', type: 'blondie' }, amount: 10 });
        done();
      });
      col.insertOne(
        {_id: 6, item: { category: 'brownies', type: 'blondie' }, amount: 10 }
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
      expect(result.insertedCount).to.eql(2);
      expect(storedDoc(result.insertedIds[0] as any))
        .to.eql({_id: result.insertedIds[0], item: { category: 'brownies', type: 'blondie' }, amount: 10 });
      expect(storedDoc(result.insertedIds[1] as any))
        .to.eql({_id: result.insertedIds[1], item: { category: 'brownies', type: 'baked' }, amount: 12 });
    });
    it('should throw when trying to insert a document with already existing ID', () => {
      return expect(col.insertMany([
        {item: { category: 'brownies', type: 'blondie' }, amount: 10 },
        {_id: 1, item: { category: 'brownies', type: 'baked' }, amount: 12 },
      ])).to.eventually.be.rejected;
    });
    /*
    it('should emit a change event', (done) => {
      col.on('change', ({action, data}) => {
        expect(action).to.eql('insert');
        expect(data.length).to.eql(2);
        done();
      });
      col.insertMany([
        {item: { category: 'brownies', type: 'blondie' }, amount: 10 },
        {item: { category: 'brownies', type: 'baked' }, amount: 12 },
      ]);
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
        upsertedId: null,
      });
      expect(storedDoc(1)).to.eql({_id: '1', item: { category: 'brownies', type: 'blondie' }, amount: 20 });
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
        upsertedId: null,
      });
    });
    it('should completely replace document', async () => {
      await col.replaceOne(
        {_id: '1'}, { amount: 20 }
      );
      expect(storedDoc(1)).to.eql({_id: '1', amount: 20 });
    });
    it('should upsert when specified', async () => {
      const result = await col.replaceOne(
        {_id: '6'}, { amount: 20 }, {upsert: true}
      );
      expect(result.upsertedCount).to.eql(1);
      expect(result.upsertedId).to.not.eql(undefined);
      expect(storedDoc(result.upsertedId as any)).to.eql({_id: result.upsertedId, amount: 20 });
    });
    /*
    it('should emit a change event', (done) => {
      col.on('change', ({action, data}) => {
        expect(action).to.eql('replace');
        expect(data[0]).to.eql({_id: 1, item: { category: 'cake', type: 'chiffon' }, amount: 10 });
        expect(data[1]).to.eql({_id: 1, item: { category: 'brownies', type: 'blondie' }, amount: 20 });
        done();
      });
      col.replaceOne(
        {_id: 1}, {item: { category: 'brownies', type: 'blondie' }, amount: 20 }
      );
    });
    */
  });

  describe('count', () => {
    it('should return 0 when no documents are matching', () => {
      expect(col.countDocuments({'item.category': 'candy'})).to.eventually.eql(0);
    });
    it('should be a positive number when items are matched', async () => {
      expect(col.countDocuments({'item.category': 'cake'})).to.eventually.eql(3);
    });
  });

  describe('findOne', () => {
    it('should return null when document is not found', () => {
      return expect(col.findOne({_id: '7'})).to.eventually.eql(null);
    });
    it('should return the document when found', async () => {
      const doc = await col.findOne({_id: '1'});
      expect(doc).to.not.be.null;
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
      const storedCount = storedFiles().length;
      await col.deleteOne({_id: '1'});
      expect(col.findOne({_id: '1'})).to.eventually.be.null;
      expect(storedFiles().length).to.eql(storedCount - 1);
      expect(storedFiles()).to.not.contain('1.json');
    });
    /*
    it('should emit a change event if a document was removed', (done) => {
      col.on('change', ({action, data}) => {
        expect(action).to.eql('delete');
        expect(data.length).to.eql(1);
        expect(data[0]).to.eql({_id: 1, item: { category: 'cake', type: 'chiffon' }, amount: 10 });
        done();
      });
      col.deleteOne({_id: 1});
    });
    */
  });

  describe('deleteMany', () => {
    it('should return zero deletedCount when no document match selector', () => {
      return expect(col.deleteMany({_id: '7'}))
        .to.eventually.eql({acknowledged: true, deletedCount: 0});
    });
    it('should return non-zero deletedCount when documents match selector', async () => {
      const storedCount = storedFiles().length;
      const result = await col.deleteMany({'item.category': 'cookies'});
      expect(result.deletedCount).to.eql(2);
      expect(storedFiles().length).to.eql(storedCount - 2);
    });
    it('should have removed selected documents', async () => {
      await col.deleteMany({'item.category': 'cookies'});
      return expect(col.countDocuments({'item.category': 'cookies'})).to.eventually.eql(0);
    });
    it('should not remove other documents', async () => {
      await col.deleteMany({'item.category': 'cookies'});
      return expect(col.countDocuments()).to.eventually.eql(3);
    });
    /*
    it('should emit a change event', (done) => {
      col.on('change', ({action, data}) => {
        expect(action).to.eql('delete');
        expect(data.length).to.eql(2);
        done();
      });
      col.deleteMany({'item.category': 'cookies'});
    });
    */
  });
});
