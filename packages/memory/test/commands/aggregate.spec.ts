import 'mingo/init/system';
import { expect } from 'chai';
import 'mocha';
import MemoryStorageEngineFactory from '../../src';
import { MingoAggregatorFactory } from '../../../mingo/src';
import { StorageEngine } from '@tashmet/engine';

const storageEngineFact = new MemoryStorageEngineFactory(new MingoAggregatorFactory());

describe('aggregate', () => {
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

  it('should return aggregate result', async () => {
    const {cursor} = await engine.command({
      aggregate: 'test',
      pipeline: [
        { $match: { category: "cake" } },
        { $project: { _id: 0, type: 1 }},
      ]
    });
    expect(cursor.firstBatch).to.eql([
      { type: "chocolate" },
      { type: "ice cream" },
    ]);
  });

  describe('custom batch size', () => {
    let cursorId: number | undefined;

    it('should handle custom batch size', async () => {
      const {cursor} = await engine.command({
        aggregate: 'test',
        pipeline: [
          { $match: { category: "cake" } },
          { $project: { _id: 0, type: 1 }},
        ],
        cursor: { batchSize: 1 }
      });
      cursorId = cursor.id;
      expect(cursor.firstBatch).to.eql([
        { type: "chocolate" },
      ]);
    });

    it('should get more', async () => {
      const {cursor} = await engine.command({
        getMore: cursorId,
        collection: 'test',
      });
      expect(cursor.nextBatch).to.eql([
        { type: "ice cream" },
      ]);
    });
  });
});
