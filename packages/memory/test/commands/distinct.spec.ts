import 'mingo/init/system';
import chai from 'chai';
import 'mocha';
import Memory from '../../src';
import mingo from '@tashmet/mingo';
import { Namespace, Store } from '@tashmet/tashmet';

const { expect } = chai;

describe('distinct', () => {
  let engine: Store;

  const ns: Namespace = { db: 'testdb', coll: 'inventory' };

  before(async () => {
    engine = Memory
      .configure({})
      .use(mingo())
      .bootstrap();

    await engine.command(ns, {create: 'inventory'});
    await engine.command(ns, {insert: 'inventory', documents: [
      { _id: 1, dept: "A", item: { sku: "111", color: "red" }, sizes: [ "S", "M" ] },
      { _id: 2, dept: "A", item: { sku: "111", color: "blue" }, sizes: [ "M", "L" ] },
      { _id: 3, dept: "B", item: { sku: "222", color: "blue" }, sizes: "S" },
      { _id: 4, dept: "A", item: { sku: "333", color: "black" }, sizes: [ "S" ] },
    ]});
  });

  it('should return distinct values for a field', async () => {
    const result = await engine.command(ns, {
      distinct: 'inventory',
      key: 'dept'
    });
    expect(result).to.eql({values: ['A', 'B'], ok: 1});
  });

  it('should return distinct values for embedded field', async () => {
    const result = await engine.command(ns, {
      distinct: 'inventory',
      key: 'item.sku'
    });
    expect(result).to.eql({values: ['111', '222', '333'], ok: 1});
  });

  it('should return distinct values for array field', async () => {
    const result = await engine.command(ns, {
      distinct: 'inventory',
      key: 'sizes'
    });
    expect(result).to.eql({values: ['S', 'M', 'L'], ok: 1});
  });

  it('should return distinct values with query', async () => {
    const result = await engine.command(ns, {
      distinct: 'inventory',
      key: 'item.sku',
      query: { dept: "A"}
    });
    expect(result).to.eql({values: ['111', '333'], ok: 1});
  });
});
