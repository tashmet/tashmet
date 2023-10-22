import 'mingo/init/system';
import chai from 'chai';
import 'mocha';
import Memory from '../../src';
import mingo from '@tashmet/mingo';
import { Namespace } from '@tashmet/tashmet';
import { StorageEngine } from '@tashmet/engine';

const { expect } = chai;

describe('update', () => {
  let engine: StorageEngine;

  const ns: Namespace = { db: 'testdb', coll: 'test' };

  before(async () => {
    engine = Memory
      .configure({})
      .use(mingo())
      .bootstrap();

    await engine.command(ns, {create: 'test'});
    await engine.command(ns, {insert: 'test', documents: [
      { _id: 1, category: "cake", type: "chocolate", qty: 10 },
      { _id: 2, category: "cake", type: "ice cream", qty: 25 },
      { _id: 3, category: "pie", type: "boston cream", qty: 20 },
      { _id: 4, category: "pie", type: "blueberry", qty: 15 }
    ]});
  });

  it('should update a single document', async () => {
    const result = await engine.command(ns, {
      update: 'test',
      updates: [{q: {_id: 1}, u: {$set: {qty: 20}}}]
    });
    expect(result).to.eql({ok: 1, n: 1, nModified: 1, upserted: []});
  });

  it('should have updated the document in the store', async () => {
    const {cursor} = await engine.command(ns, {find: 'test', filter: {_id: 1}});
    expect(cursor.firstBatch[0]).to.eql({_id: 1, category: "cake", type: "chocolate", qty: 20});
  });

  it('should fail to update when no document matches query', async () => {
    const result = await engine.command(ns, {
      update: 'test',
      updates: [{q: {_id: 5}, u: {$set: {qty: 20}}}]
    });
    expect(result).to.eql({ok: 1, n: 0, nModified: 0, upserted: []});
  });

  it('should upsert when specified', async () => {
    const result = await engine.command(ns, {
      update: 'test',
      updates: [
        {q: {_id: 5}, u: {_id: 5, category: 'candy', type: 'chocolate'}, upsert: true}
      ]
    });
    expect(result).to.eql({
      ok: 1,
      n: 1,
      nModified: 0,
      upserted: [
        { index: 0, _id: 5 }
    ]});
  });

  it('should update multiple documents', async () => {
    const result = await engine.command(ns, {
      update: 'test',
      updates: [
        {q: {category: 'cake'}, u: {$set: {qty: 30}}, multi: true}
      ]
    });
    expect(result).to.eql({ok: 1, n: 2, nModified: 2, upserted: []});
  });

  it('should only update multiple documents when multi set to true', async () => {
    const result = await engine.command(ns, {
      update: 'test',
      updates: [
        {q: {category: 'cake'}, u: {$set: {qty: 10}}}
      ]
    });
    expect(result).to.eql({ok: 1, n: 1, nModified: 1, upserted: []});
  });

  it('should update using pipeline', async () => {
    const result = await engine.command(ns, {
      update: 'test',
      updates: [
        {q: {category: 'cake'}, u: [{$set: {qty: 10}}]}
      ]
    });
    expect(result).to.eql({ok: 1, n: 1, nModified: 1, upserted: []});
  });
});
