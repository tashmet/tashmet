import {Collection, Database, memory} from '@tashmit/database';
import operators from '@tashmit/operators/system';
import {DatabaseService} from '@tashmit/database/dist/database';
import {DefaultLogger} from '../../../core/dist/logging/logger';
import {JoinPipeFactory, SplitPipeFactory} from '../../src/middleware/relationship';
import {expect} from 'chai';
import 'mocha';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe('relationship', () => {
  let database: Database;
  let inventory: Collection;

  before(async () => {
    database = new DatabaseService({collections: {}, operators}, new DefaultLogger());
    inventory = await database.createCollection('inventory', memory({documents: [
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

    it('should upsert on split when configured to', async () => {
      const fact = new SplitPipeFactory({
        to: 'inventory',
        localField: 'item',
        foreignField: 'sku',
        as: 'inventory',
        single: true,
        upsert: true,
      });
      const pipe = await fact.create({} as Collection, database);

      await pipe({
        item: 'almonds',
        inventory: {_id: 1, sku: 'almonds', description: 'product 1', instock: 125}
      });

      return expect(inventory.findOne({_id: 1}))
        .to.eventually.eql({_id: 1, sku: 'almonds', description: 'product 1', instock: 125});
    });

    it('should not upsert on split when configured not to', async () => {
      const fact = new SplitPipeFactory({
        to: 'inventory',
        localField: 'item',
        foreignField: 'sku',
        as: 'inventory',
        single: true,
        upsert: false,
      });
      const pipe = await fact.create({} as Collection, database);

      await pipe({
        item: 'almonds',
        inventory: {_id: 1, sku: 'almonds', description: 'product 1', instock: 130}
      });

      return expect(inventory.findOne({_id: 1}))
        .to.eventually.eql({_id: 1, sku: 'almonds', description: 'product 1', instock: 125});
    });
  });
});
