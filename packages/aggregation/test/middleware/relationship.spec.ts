import Tashmit, {Container, Database} from '@tashmit/tashmit';
import {MiddlewareContext} from '@tashmit/database';
import operators from '@tashmit/operators/system';
import {joinPipe, splitPipe} from '../../src/middleware/relationship';
import {expect} from 'chai';
import 'mocha';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe('relationship', () => {
  let database: Database;
  let container: Container;
  let middlewareContext: MiddlewareContext;

  before(async () => {
    container = Tashmit
      .withConfiguration({operators})
      .collection('inventory', [
        {_id: 1, sku: 'almonds', description: 'product 1', instock: 120},
        {_id: 2, sku: 'bread', description: 'product 2', instock: 80},
        {_id: 3, sku: 'cashews', description: 'product 3', instock: 60},
        {_id: 4, sku: 'pecans', description: 'product 4', instock: 70},
        {_id: 5, sku: null, description: 'Incomplete' },
        {_id: 6 },
      ])
      .bootstrap(Container);

    database = container.resolve(Database);

    middlewareContext = {
      database,
      collection: database.collection('inventory'),
    }
  });

  describe('joinPipe', () => {
    it('should join documents as list', async () => {
      const fact = joinPipe({
        to: 'inventory',
        localField: 'item',
        foreignField: 'sku',
        as: 'inventory',
        single: false,
        upsert: true,
      });
      const pipe = fact.resolve(container)(middlewareContext);

      return expect(pipe({item: 'almonds', price: 12, quantity: 2}))
        .to.eventually.eql({item: 'almonds', price: 12, quantity: 2, inventory: [
          {_id: 1, sku: 'almonds', description: 'product 1', instock: 120}
        ]});
    });

    it('should join a single document', async () => {
      const fact = joinPipe({
        to: 'inventory',
        localField: 'item',
        foreignField: 'sku',
        as: 'inventory',
        single: true,
        upsert: true,
      });
      const pipe = fact.resolve(container)(middlewareContext);

      return expect(pipe({item: 'almonds'}))
        .to.eventually.eql({
          item: 'almonds',
          inventory: {_id: 1, sku: 'almonds', description: 'product 1', instock: 120}
        });
    });

    it('should join on same key', async () => {
      const fact = joinPipe({
        to: 'inventory',
        localField: 'item',
        foreignField: 'sku',
        as: 'item',
        single: true,
        upsert: true,
      });
      const pipe = fact.resolve(container)(middlewareContext);

      return expect(pipe({item: 'almonds'}))
        .to.eventually.eql({
          item: {_id: 1, sku: 'almonds', description: 'product 1', instock: 120}
        });
    });
  });

  describe('splitPipe', () => {
    it('should split documents as list', async () => {
      const fact = splitPipe({
        to: 'inventory',
        localField: 'item',
        foreignField: 'sku',
        as: 'inventory',
        single: false,
        upsert: true,
      });
      const pipe = fact.resolve(container)(middlewareContext);

      return expect(pipe({
        item: 'almonds',
        price: 12,
        quantity: 2,
        inventory: [{_id: 1, sku: 'almonds', description: 'product 1', instock: 120}]
      }))
        .to.eventually.eql({item: 'almonds', price: 12, quantity: 2});
    });

    it('should split a single document', async () => {
      const fact = splitPipe({
        to: 'inventory',
        localField: 'item',
        foreignField: 'sku',
        as: 'inventory',
        single: true,
        upsert: true,
      });
      const pipe = fact.resolve(container)(middlewareContext);

      return expect(pipe({
        item: 'almonds',
        inventory: {_id: 1, sku: 'almonds', description: 'product 1', instock: 120}
      }))
        .to.eventually.eql({item: 'almonds'});
    });

    it('should split on same key', async () => {
      const fact = splitPipe({
        to: 'inventory',
        localField: 'item',
        foreignField: 'sku',
        as: 'item',
        single: true,
        upsert: true,
      });
      const pipe = fact.resolve(container)(middlewareContext);

      return expect(pipe({
        item: {_id: 1, sku: 'almonds', description: 'product 1', instock: 120}
      }))
        .to.eventually.eql({item: 'almonds'});
    });

    it('should upsert on split when configured to', async () => {
      const fact = splitPipe({
        to: 'inventory',
        localField: 'item',
        foreignField: 'sku',
        as: 'inventory',
        single: true,
        upsert: true,
      });
      const pipe = fact.resolve(container)(middlewareContext);

      await pipe({
        item: 'almonds',
        inventory: {_id: 1, sku: 'almonds', description: 'product 1', instock: 125}
      });

      return expect(database.collection('inventory').findOne({_id: 1}))
        .to.eventually.eql({_id: 1, sku: 'almonds', description: 'product 1', instock: 125});
    });

    it('should not upsert on split when configured not to', async () => {
      const fact = splitPipe({
        to: 'inventory',
        localField: 'item',
        foreignField: 'sku',
        as: 'inventory',
        single: true,
        upsert: false,
      });
      const pipe = fact.resolve(container)(middlewareContext);

      await pipe({
        item: 'almonds',
        inventory: {_id: 1, sku: 'almonds', description: 'product 1', instock: 130}
      });

      return expect(database.collection('inventory').findOne({_id: 1}))
        .to.eventually.eql({_id: 1, sku: 'almonds', description: 'product 1', instock: 125});
    });
  });
});
