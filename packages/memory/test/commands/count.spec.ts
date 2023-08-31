import chai from 'chai';
import 'mocha';
import MemoryStorageEngineFactory from '../../src';
import { MingoAggregatorFactory } from '../../../mingo/src';
import { StorageEngine } from '@tashmet/engine';
import { DefaultLogger } from '@tashmet/core';

const { expect } = chai;
const logger = new DefaultLogger();
const storageEngineFact = new MemoryStorageEngineFactory(new MingoAggregatorFactory(logger), logger);

describe('count', () => {
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

  describe('without query', () => {
    it('should return total document count', async () => {
      const result = await engine.command({
        count: 'test',
      });
      expect(result).to.eql({n: 4, ok: 1});
    });
  });

  describe('with query', () => {
    it('should return zero count when no document matches query', async () => {
      const result = await engine.command({
        count: 'test',
        query: {category: 'candy'}
      });
      expect(result).to.eql({n: 0, ok: 1});
    });

    it('should return correct count when documents match query', async () => {
      const result = await engine.command({
        count: 'test',
        query: {category: 'cake'}
      });
      expect(result).to.eql({n: 2, ok: 1});
    });

    it('should handle skip', async () => {
      const result = await engine.command({
        count: 'test',
        query: {category: 'cake'},
        skip: 1
      });
      expect(result).to.eql({n: 1, ok: 1});
    });

    it('should handle limit', async () => {
      const result = await engine.command({
        count: 'test',
        query: {category: 'cake'},
        limit: 1
      });
      expect(result).to.eql({n: 1, ok: 1});
    });
  });
});
