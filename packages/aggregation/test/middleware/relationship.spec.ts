import {Collection, Database, memory} from '@ziqquratu/database';
import {DatabaseService} from '@ziqquratu/database/dist/database';
import {DefaultLogger} from '../../../core/dist/logging/logger';
import {JoinPipeFactory, SplitPipeFactory} from '../../src/middleware/relationship';
import {expect} from 'chai';
import 'mocha';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe.only('relationship', () => {
  let database: Database;

  before(async () => {
    database = new DatabaseService({collections: {}}, new DefaultLogger());
    await database.createCollection('inventory', memory({documents: [
      {_id: 1, sku: 'almonds', description: 'product 1', instock: 120},
      {_id: 2, sku: 'bread', description: 'product 2', instock: 80},
      {_id: 3, sku: 'cashews', description: 'product 3', instock: 60},
      {_id: 4, sku: 'pecans', description: 'product 4', instock: 70},
      {_id: 5, sku: null, description: 'Incomplete' },
      {_id: 6 },
    ]}));
  });

  describe('JoinPipeFactory', () => {
    it('should join documents as list', async () => {
      const fact = new JoinPipeFactory({
        to: 'inventory',
        localField: 'item',
        foreignField: 'sku',
        as: 'inventory',
        single: false,
        upsert: true,
      });
      const pipe = await fact.create({} as Collection, database);

      return expect(pipe({item: 'almonds', price: 12, quantity: 2}))
        .to.eventually.eql({item: 'almonds', price: 12, quantity: 2, inventory: [
          {_id: 1, sku: 'almonds', description: 'product 1', instock: 120}
        ]});
    });

    it('should join a single document', async () => {
      const fact = new JoinPipeFactory({
        to: 'inventory',
        localField: 'item',
        foreignField: 'sku',
        as: 'inventory',
        single: true,
        upsert: true,
      });
      const pipe = await fact.create({} as Collection, database);

      return expect(pipe({item: 'almonds'}))
        .to.eventually.eql({
          item: 'almonds',
          inventory: {_id: 1, sku: 'almonds', description: 'product 1', instock: 120}
        });
    });

    it('should join on same key', async () => {
      const fact = new JoinPipeFactory({
        to: 'inventory',
        localField: 'item',
        foreignField: 'sku',
        as: 'item',
        single: true,
        upsert: true,
      });
      const pipe = await fact.create({} as Collection, database);

      return expect(pipe({item: 'almonds'}))
        .to.eventually.eql({
          item: {_id: 1, sku: 'almonds', description: 'product 1', instock: 120}
        });
    });
  });

  describe('SplitPipeFactory', () => {
    it('should split documents as list', async () => {
      const fact = new SplitPipeFactory({
        to: 'inventory',
        localField: 'item',
        foreignField: 'sku',
        as: 'inventory',
        single: false,
        upsert: true,
      });
      const pipe = await fact.create({} as Collection, database);

      return expect(pipe({
        item: 'almonds',
        price: 12,
        quantity: 2,
        inventory: [{_id: 1, sku: 'almonds', description: 'product 1', instock: 120}]
      }))
        .to.eventually.eql({item: 'almonds', price: 12, quantity: 2});
    });

    it('should split a single document', async () => {
      const fact = new SplitPipeFactory({
        to: 'inventory',
        localField: 'item',
        foreignField: 'sku',
        as: 'inventory',
        single: true,
        upsert: true,
      });
      const pipe = await fact.create({} as Collection, database);

      return expect(pipe({
        item: 'almonds',
        inventory: {_id: 1, sku: 'almonds', description: 'product 1', instock: 120}
      }))
        .to.eventually.eql({item: 'almonds'});
    });

    it('should split on same key', async () => {
      const fact = new SplitPipeFactory({
        to: 'inventory',
        localField: 'item',
        foreignField: 'sku',
        as: 'item',
        single: true,
        upsert: true,
      });
      const pipe = await fact.create({} as Collection, database);

      return expect(pipe({
        item: {_id: 1, sku: 'almonds', description: 'product 1', instock: 120}
      }))
        .to.eventually.eql({item: 'almonds'});
    });
  });
});
