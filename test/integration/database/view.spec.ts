import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import Tashmet, { Collection } from '../../../packages/tashmet/dist/index.js';
import mingo from '../../../packages/mingo/dist/index.js';
import Memory from '../../../packages/memory/dist/index.js';
import 'mingo/init/system';

chai.use(chaiAsPromised);

const { expect } = chai;

describe('view', () => {
  let sales: Collection;
  let totals: Collection;

  before(async () => {
    const store = Memory
      .configure({})
      .use(mingo())
      .bootstrap();

    const client = await Tashmet.connect(store.proxy());

    const db = client.db('testdb');

    sales = db.collection('sales');
    totals = db.createCollection('totals', {
      viewOn: 'sales',
      pipeline: [
        {$group: {
          _id : '$item',
          totalSaleAmount: {$sum: {$multiply: ['$price', '$quantity']}}
        }},
        {$match: {'totalSaleAmount': {$gte: 100}}}
      ],
    });
  })

  beforeEach(async () => {
    await sales.insertMany([
      { _id : 1, item : 'abc', price : 10,  quantity: 2},
      { _id : 2, item : 'jkl', price : 20,  quantity: 1},
      { _id : 3, item : 'xyz', price : 5,   quantity: 10},
      { _id : 4, item : 'xyz', price : 5,   quantity: 20},
      { _id : 5, item : 'abc', price : 10,  quantity: 10},
      { _id : 6, item : 'def', price : 7.5, quantity: 5},
      { _id : 7, item : 'def', price : 7.5, quantity: 10},
      { _id : 8, item : 'abc', price : 10,  quantity: 5},
    ]);
  });

  afterEach(async () => {
    await sales.deleteMany({});
  });

  it('should initially have correct documents', () => {
    return expect(totals.find().toArray())
      .to.eventually.eql([
        {_id : 'abc', 'totalSaleAmount': 170},
        {_id : 'xyz', 'totalSaleAmount': 150},
        {_id : 'def', 'totalSaleAmount': 112.5},
      ]);
  });

  it('should update on replace', async () => {
    await sales.replaceOne({_id: 1}, {_id : 1, item: 'abc', price: 12, quantity: 2});

    return expect(totals.findOne({_id: 'abc'}))
      .to.eventually.eql({_id : 'abc', 'totalSaleAmount': 174});
  });

  it('should update on delete', async () => {
    await sales.deleteOne({_id: 1});

    return expect(totals.findOne({_id: 'abc'}))
      .to.eventually.eql({_id : 'abc', 'totalSaleAmount': 150});
  });

  it('should remove no longer existing documents', async () => {
    await sales.deleteMany({item: 'abc'});

    const result = await totals.find().toArray();

    return expect(result).to.eql([
      {_id : 'xyz', 'totalSaleAmount': 150},
      {_id : 'def', 'totalSaleAmount': 112.5},
    ]);
  });

  it('should add new documents', async () => {
    await sales.insertOne({item: 'ghi', price: 20, quantity: 10});

    return expect(totals.findOne({_id: 'ghi'}))
      .to.eventually.eql({_id : 'ghi', 'totalSaleAmount': 200});
  });
  /*

  it('should emit insert change event', async () => {
    const cs = totals.watch();

    await sales.insertOne({item: 'mno', price: 20, quantity: 10});

    const change = cs.next();
    expect(change).to.not.be.undefined;
    expect(change?.operationType).to.eql('insert');
    expect(change?.fullDocument).to.eql({_id: 'mno', totalSaleAmount: 200});
  });

  it('should emit delete change event', async () => {
    const cs = totals.watch();

    await sales.deleteOne({_id: 7});

    const change = cs.next();
    expect(change).to.not.be.undefined;
    expect(change?.operationType).to.eql('delete');
    expect(change?.documentKey).to.eql('def');
  });

  it('should emit replace change event', async () => {
    const cs = totals.watch();

    await sales.deleteOne({_id: 3});

    const change = cs.next();
    expect(change).to.not.be.undefined;
    expect(change?.operationType).to.eql('replace');
    expect(change?.fullDocument).to.eql({_id: 'xyz', totalSaleAmount: 100});
  });
  */

  describe('mutation', () => {
    it('should not be possible with insertOne', () => {
      expect(totals.insertOne({item: 'mno', price: 20, quantity: 10}))
        .to.eventually.throw();
    });

    it('should not be possible with insertMany', () => {
      expect(totals.insertMany([{item: 'mno', price: 20, quantity: 10}]))
        .to.eventually.throw();
    });

    it('should not be possible with deleteOne', () => {
      expect(totals.deleteOne([{item: 'mno'}]))
        .to.eventually.throw();
    });

    it('should not be possible with deleteMany', () => {
      expect(totals.deleteMany([{item: 'mno'}]))
        .to.eventually.throw();
    });

    it('should not be possible with replaceOne', () => {
      expect(totals.replaceOne({_id: 1}, {item: 'mno', price: 20, quantity: 10}))
        .to.eventually.throw();
    });
  });
});
