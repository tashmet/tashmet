import Tashmet, { Collection, Database, TashmetProxy } from '@tashmet/tashmet';
import 'mocha';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const { expect } = chai;

export interface StoreInspector {
  ids(): string[];

  document(id: string): Document | undefined;
}

export function collection(proxy: TashmetProxy, storeInspector?: StoreInspector) {
  let col: Collection<any>;
  let db: Database;

  before(async () => {
    const tashmet = await Tashmet.connect(proxy);
    db = tashmet.db('e2e');
    col = await db.createCollection('testCollection');
  });

  it('should have created a document in system.collections', async () => {
    const doc = await db.collection('system.collections').findOne({ _id: 'testCollection' });
    expect(doc).to.not.be.null;
  });

  describe('operations', () => {
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
      await col.deleteMany({});
    });

    describe('insertOne', () => {
      it('should add a single document and give it an id', async () => {
        const doc = {item: { category: 'brownies', type: 'blondie' }, amount: 10 };
        const result = await col.insertOne(doc);
        expect(result.acknowledged).to.be.true
        expect(doc).to.haveOwnProperty('_id');
        const id = (doc as any)._id;

        if (storeInspector) {
          expect(storeInspector.document(id))
            .to.eql({ item: { category: "brownies", type: "blondie" }, amount: 10, _id: id });
        }
      });
      it('should throw when trying to insert a document with already existing ID', () => {
        expect(col.insertOne(
          {_id: '1', item: { category: 'brownies', type: 'blondie' }, amount: 10 }
        )).to.eventually.be.rejected;

        if (storeInspector) {
          expect(storeInspector.document('1'))
            .to.eql({_id: '1', item: { category: 'cake', type: 'chiffon' }, amount: 10 });
        }
      });
      it('should emit a change event', (done) => {
        const cs = col.watch();
        cs.on('change', ({operationType, fullDocument}) => {
          expect(operationType).to.eql('insert');
          expect(fullDocument).to.eql({_id: '6', item: { category: 'brownies', type: 'blondie' }, amount: 10 });
          cs.close();
          done();
        });
        col.insertOne(
          {_id: '6', item: { category: 'brownies', type: 'blondie' }, amount: 10 }
        );
      });
    });

    describe('insertMany', () => {
      it('should add a multiple documents and give them ids', async () => {
        const result = await col.insertMany([
          {item: { category: 'brownies', type: 'blondie' }, amount: 10 },
          {item: { category: 'brownies', type: 'baked' }, amount: 12 },
        ]);
        expect(result.insertedCount).to.eql(2);

        if (storeInspector) {
          expect(storeInspector.document(result.insertedIds[0] as any))
            .to.eql({_id: result.insertedIds[0], item: { category: 'brownies', type: 'blondie' }, amount: 10 });
          expect(storeInspector.document(result.insertedIds[1] as any))
            .to.eql({_id: result.insertedIds[1], item: { category: 'brownies', type: 'baked' }, amount: 12 });
        }
      });
      it('should throw when trying to insert a document with already existing ID', () => {
        return expect(col.insertMany([
          {item: { category: 'brownies', type: 'blondie' }, amount: 10 },
          {_id: '1', item: { category: 'brownies', type: 'baked' }, amount: 12 },
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
          {_id: '1'}, {item: { category: 'brownies', type: 'blondie' }, amount: 20 }
        );
        expect(result).to.eql({
          acknowledged: true,
          matchedCount: 1,
          modifiedCount: 1,
          upsertedCount: 0,
          upsertedId: null,
        });
        if (storeInspector) {
          expect(storeInspector.document('1')).to.eql({_id: '1', item: { category: 'brownies', type: 'blondie' }, amount: 20 });
        }
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
        if (storeInspector) {
          expect(storeInspector.document('1')).to.eql({_id: '1', amount: 20 });
        }
      });
      it('should upsert when specified', async () => {
        const result = await col.replaceOne(
          {_id: '6'}, { amount: 20 }, {upsert: true}
        );
        expect(result.upsertedCount).to.eql(1);
        expect(result.upsertedId).to.not.eql(undefined);

        if (storeInspector) {
          expect(storeInspector.document(result.upsertedId as any)).to.eql({_id: result.upsertedId, amount: 20 });
        }
      });
      it('should emit a change event', (done) => {
        const cs = col.watch();
        cs.on('change', ({operationType, documentKey, fullDocument}) => {
          expect(operationType).to.eql('replace');
          expect(documentKey).to.eql({_id: '1'})
          expect(fullDocument).to.eql({item: { category: 'brownies', type: 'blondie' }, amount: 20, _id: '1'});
          cs.close();
          done();
        });
        col.replaceOne(
          {_id: '1'}, {item: { category: 'brownies', type: 'blondie' }, amount: 20 }
        );
      });
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
        if (storeInspector) {
          const storedCount = storeInspector.ids().length;
          await col.deleteOne({_id: '1'});
          expect(col.findOne({_id: '1'})).to.eventually.be.null;
          expect(storeInspector.ids().length).to.eql(storedCount - 1);
          expect(storeInspector.document('1')).to.be.undefined;
        } else {
          await col.deleteOne({_id: '1'});
          expect(col.findOne({_id: '1'})).to.eventually.be.null;
        }
      });
      it('should emit a change event if a document was removed', (done) => {
        const cs = col.watch();
        cs.on('change', ({operationType, documentKey}) => {
          expect(operationType).to.eql('delete');
          expect(documentKey).to.eql({_id: '1'});
          cs.close();
          done();
        });
        col.deleteOne({_id: '1'});
      });
    });

    describe('deleteMany', () => {
      it('should return zero deletedCount when no document match selector', () => {
        return expect(col.deleteMany({_id: '7'}))
          .to.eventually.eql({acknowledged: true, deletedCount: 0});
      });
      it('should return non-zero deletedCount when documents match selector', async () => {
        if (storeInspector) {
          const storedCount = storeInspector.ids().length;
          const result = await col.deleteMany({'item.category': 'cookies'});
          expect(result.deletedCount).to.eql(2);
          expect(storeInspector.ids().length).to.eql(storedCount - 2);
        } else {
          const result = await col.deleteMany({'item.category': 'cookies'});
          expect(result.deletedCount).to.eql(2);
        }
      });
      it('should have removed selected documents', async () => {
        await col.deleteMany({'item.category': 'cookies'});
        return expect(col.countDocuments({'item.category': 'cookies'})).to.eventually.eql(0);
      });
      it('should not remove other documents', async () => {
        await col.deleteMany({'item.category': 'cookies'});
        return expect(col.countDocuments()).to.eventually.eql(3);
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

  describe('drop', () => {
    it('should drop collection', async () => {
      const res = await col.drop();
      expect(res).to.be.true;
    });

    it('should have removed collection from system.collections', async () => {
      const doc = await db.collection('system.collections').findOne({ _id: 'testCollection' });
      expect(doc).to.be.null;
    });
  });
}
