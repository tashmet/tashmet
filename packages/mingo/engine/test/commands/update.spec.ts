import 'mingo/init/system';
import { expect } from 'chai';
import 'mocha';
import { MemoryStorageEngine, MingoCursorRegistry } from '../../src/storageEngine';
import { MingoDatabaseEngine } from '../../src';


let store = new MemoryStorageEngine('testdb', {'test': [
  { _id: 1, category: "cake", type: "chocolate", qty: 10 },
  { _id: 2, category: "cake", type: "ice cream", qty: 25 },
  { _id: 3, category: "pie", type: "boston cream", qty: 20 },
  { _id: 4, category: "pie", type: "blueberry", qty: 15 }
]});
let cursors = new MingoCursorRegistry();
let engine = new MingoDatabaseEngine(store, cursors, {});

describe('update', () => {
  it('should update a single document', async () => {
    const result = await engine.command({
      update: 'test',
      updates: [{q: {_id: 1}, u: {$set: {qty: 20}}}]
    });
    expect(result).to.eql({ok: 1, n: 1, nModified: 1, upserted: []});
  });

  it('should have updated the document in the store', async () => {
    expect(store.documents('test')[0]).to.eql({_id: 1, category: "cake", type: "chocolate", qty: 20});
  });

  it('should fail to update when no document matches query', async () => {
    const result = await engine.command({
      update: 'test',
      updates: [{q: {_id: 5}, u: {$set: {qty: 20}}}]
    });
    expect(result).to.eql({ok: 1, n: 0, nModified: 0, upserted: []});
  });

  it('should update multiple documents', async () => {
    const result = await engine.command({
      update: 'test',
      updates: [
        {q: {category: 'cake'}, u: {$set: {qty: 30}}, multi: true}
      ]
    });
    expect(result).to.eql({ok: 1, n: 2, nModified: 2, upserted: []});
  });

  it('should only update multiple documents when multi set to true', async () => {
    const result = await engine.command({
      update: 'test',
      updates: [
        {q: {category: 'cake'}, u: {$set: {qty: 10}}}
      ]
    });
    expect(result).to.eql({ok: 1, n: 1, nModified: 1, upserted: []});
  });

  it('should update using pipeline', async () => {
    const result = await engine.command({
      update: 'test',
      updates: [
        {q: {category: 'cake'}, u: [{$set: {qty: 10}}]}
      ]
    });
    expect(result).to.eql({ok: 1, n: 1, nModified: 1, upserted: []});
  });
});
