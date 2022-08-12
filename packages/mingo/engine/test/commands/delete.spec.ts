import {expect} from 'chai';
import 'mocha';
import { MingoDatabaseEngine } from '../../src';
import { MemoryStorageEngine } from '../../src/storageEngine';


let store = new MemoryStorageEngine('testdb', {'test': [
  { _id: 1, category: "cake", type: "chocolate", qty: 10 },
  { _id: 2, category: "cake", type: "ice cream", qty: 25 },
  { _id: 3, category: "pie", type: "boston cream", qty: 20 },
  { _id: 4, category: "pie", type: "blueberry", qty: 15 }
]});
let engine = MingoDatabaseEngine.fromMemory(store);

describe('delete', () => {
  describe('successful delete', () => {
    it('should return correct result on success', async () => {
      const result = await engine.command({
        delete: 'test',
        deletes: [{q: {category: "cake"}, limit: 1}]
      });
      expect(result).to.eql({n: 1, ok: 1});
    });

    it('should have deleted the documents from the store', async () => {
      const it = store.stream('test');
      expect((await it.next()).value.type).to.eql('ice cream');
    });
  });
});
