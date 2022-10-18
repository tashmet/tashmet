import {expect} from 'chai';
import 'mocha';
import MemoryStorageEngineFactory from '../../src';
import { MingoAggregatorFactory } from '../../../mingo/src';
import { StorageEngine } from '@tashmet/engine';

const storageEngineFact = new MemoryStorageEngineFactory(new MingoAggregatorFactory());


describe('delete', () => {
  let engine: StorageEngine;

  before(async () => {
    engine = storageEngineFact.createStorageEngine('testdb');
    await engine.command({create: 'test'});
    await engine.command({insert: 'test', documents: [
      { _id: 1, category: "cake", type: "chocolate", qty: 10 },
      { _id: 2, category: "cake", type: "ice cream", qty: 25 },
      { _id: 3, category: "pie", type: "boston cream", qty: 20 },
      { _id: 4, category: "pie", type: "blueberry", qty: 15 }
    ]});
  });

  describe('successful delete', () => {
    it('should return correct result on success', async () => {
      const result = await engine.command({
        delete: 'test',
        deletes: [{q: {category: "cake"}, limit: 1}]
      });
      expect(result).to.eql({n: 1, ok: 1});
    });

    it('should have deleted the documents from the store', async () => {
      const {n} = await engine.command({count: 'test', query: {category: 'cake'}});
      expect(n).to.eql(1);
    });
  });
});
