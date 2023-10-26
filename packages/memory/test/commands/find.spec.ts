import chai from 'chai';
import 'mocha';
import Memory from '../../src';
import mingo from '@tashmet/mingo';
import { TashmetNamespace } from '@tashmet/tashmet';
import { StorageEngine } from '@tashmet/engine';

const { expect } = chai;


describe('find', () => {
  let engine: StorageEngine;

  const ns = new TashmetNamespace('testdb');

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

  describe('without query', () => {
    it('should return correct result on non-empty collection', async () => { 
      const {cursor, ok} = await engine.command(ns, {
        find: 'test',
      });
      expect(ok).to.eql(1);
      expect(cursor.firstBatch.length).to.eql(4);
      expect(cursor.ns).to.eql({db: 'testdb', coll: 'test'});
    });
  });

  describe('with query', () => {
    it('should return empty batch when no document matches query', async () => {
      const {cursor} = await engine.command(ns, {
        find: 'test',
        filter: { category: 'candy' }
      });
      expect(cursor.firstBatch).to.eql([]);
    });

    it('should return correct batch when documents match query', async () => {
      const {cursor} = await engine.command(ns, {
        find: 'test',
        filter: { category: 'cake' }
      });
      expect(cursor.firstBatch).to.eql([
        { _id: 1, category: "cake", type: "chocolate", qty: 10 },
        { _id: 2, category: "cake", type: "ice cream", qty: 25 },
      ]);
    });

    it('should handle skip', async () => {
      const {cursor} = await engine.command(ns, {
        find: 'test',
        filter: { category: 'cake' },
        skip: 1,
      });
      expect(cursor.firstBatch).to.eql([
        { _id: 2, category: "cake", type: "ice cream", qty: 25 },
      ]);
    });

    it('should handle limit', async () => {
      const {cursor} = await engine.command(ns, {
        find: 'test',
        filter: { category: 'cake' },
        limit: 1
      });
      expect(cursor.firstBatch).to.eql([
        { _id: 1, category: "cake", type: "chocolate", qty: 10 },
      ]);
    });

    it('should handle sorting', async () => {
      const {cursor} = await engine.command(ns, {
        find: 'test',
        sort: { qty: -1 }
      });
      expect(cursor.firstBatch).to.eql([
        { _id: 2, category: "cake", type: "ice cream", qty: 25 },
        { _id: 3, category: "pie", type: "boston cream", qty: 20 },
        { _id: 4, category: "pie", type: "blueberry", qty: 15 },
        { _id: 1, category: "cake", type: "chocolate", qty: 10 },
      ]);
    });
  });

  describe('custom batch size', () => {
    let cursorId: number | undefined;

    it('should get initial batch', async () => {
      const {cursor} = await engine.command(ns, {
        find: 'test',
        filter: { category: 'cake' },
        batchSize: 1,
      });
      cursorId = cursor.id;
      expect(cursor.firstBatch).to.eql([
        { _id: 1, category: "cake", type: "chocolate", qty: 10 },
      ]);
    });

    it('should get more', async () => {
      const {cursor} = await engine.command(ns, {
        getMore: cursorId,
        collection: 'test',
        batchSize: 1,
      });
      expect(cursor.nextBatch).to.eql([
        { _id: 2, category: "cake", type: "ice cream", qty: 25 },
      ]);
    });
  });
});
