import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import {aggregation} from '../../packages/aggregation/dist';
import {
  bootstrap,
  component,
  Provider,
  Collection,
  Database,
  DatabaseConfig,
  memory,
} from '../../packages/ziqquratu/dist';

chai.use(chaiAsPromised);

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const salesData = [
  { _id : 1, item : 'abc', price : 10,  quantity: 2},
  { _id : 2, item : 'jkl', price : 20,  quantity: 1},
  { _id : 3, item : 'xyz', price : 5,   quantity: 10},
  { _id : 4, item : 'xyz', price : 5,   quantity: 20},
  { _id : 5, item : 'abc', price : 10,  quantity: 10},
  { _id : 6, item : 'def', price : 7.5, quantity: 5},
  { _id : 7, item : 'def', price : 7.5, quantity: 10},
  { _id : 8, item : 'abc', price : 10,  quantity: 5},
];

describe('aggregation', () => {
  @component({
    providers: [
      Provider.ofInstance<DatabaseConfig>('ziqquratu.DatabaseConfig', {
        collections: {
          sales: memory({documents: salesData}),
          totals: aggregation({
            from: 'sales',
            pipeline: [
              {
                $group: {
                  _id : '$item',
                  totalSaleAmount: {$sum: {$multiply: ['$price', '$quantity']}}
                }
              },
              {
                $match: {'totalSaleAmount': {$gte: 100}}
              }
            ]
          })
        },
      })
    ],
    inject: ['ziqquratu.Database']
  })
  class TestComponent {
    public constructor(public database: Database) {}
  }

  let sales: Collection;
  let totals: Collection;

  before(async () => {
    const app = (await bootstrap(TestComponent));
    sales = await app.database.collection('sales');
    totals = await app.database.collection('totals');
  });

  it('should initially have correct documents', async () => {
    return expect(totals.find().toArray())
      .to.eventually.eql([
        {_id : 'abc', 'totalSaleAmount': 170},
        {_id : 'xyz', 'totalSaleAmount': 150},
        {_id : 'def', 'totalSaleAmount': 112.5},
      ]);
  });

  it('should update on replace', async () => {
    await sales.replaceOne({_id: 1}, {_id : 1, item: 'abc', price: 12, quantity: 2});
    await sleep(20);

    return expect(totals.findOne({_id: 'abc'}))
      .to.eventually.eql({_id : 'abc', 'totalSaleAmount': 174});
  });

  it('should update on delete', async () => {
    await sales.deleteOne({_id: 1});
    await sleep(20);

    return expect(totals.findOne({_id: 'abc'}))
      .to.eventually.eql({_id : 'abc', 'totalSaleAmount': 150});
  });

  it('should remove no longer existing documents', async () => {
    await sales.deleteMany({item: 'abc'});
    await sleep(20);

    return expect(totals.find().toArray())
      .to.eventually.eql([
        {_id : 'xyz', 'totalSaleAmount': 150},
        {_id : 'def', 'totalSaleAmount': 112.5},
      ]);
  });

  it('should add new documents', async () => {
    await sales.insertOne({item: 'ghi', price: 20, quantity: 10});
    await sleep(20);

    return expect(totals.findOne({_id: 'ghi'}))
      .to.eventually.eql({_id : 'ghi', 'totalSaleAmount': 200});
  });
});
