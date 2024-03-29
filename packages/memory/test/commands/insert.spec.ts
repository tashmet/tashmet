import chai from 'chai';
import 'mocha';
import Memory from '../../src';
import mingo from '@tashmet/mingo';
import { TashmetNamespace } from '@tashmet/tashmet';
import { StorageEngine } from '@tashmet/engine';

const { expect } = chai;

describe('insert', () => {
  let engine: StorageEngine;

  const ns = new TashmetNamespace('testdb');

  before(async () => {
    engine = Memory
      .configure({})
      .use(mingo())
      .bootstrap();
  });

  describe('successful insert', () => {
    before(async () => {
      await engine.command(ns, {create: 'test'});
    });

    after(async () => {
      await engine.command(ns, {drop: 'test'});
    });

    it('should return correct result on success', async () => {
      const result = await engine.command(ns, {
        insert: 'test',
        documents: [{title: 'foo'}, {title: 'bar'}]
      });
      expect(result).to.eql({n: 2, ok: 1});
    });

    it('should have inserted the documents into the store', async () => {
      const {cursor} = await engine.command(ns, {find: 'test', filter: {}});
      expect(cursor.firstBatch[0].title).to.eql('foo');
      expect(cursor.firstBatch[1].title).to.eql('bar');
    });
  });

  describe('write errors', () => {
    beforeEach(async () => {
      await engine.command(ns, {create: 'test'});
      await engine.command(ns, {insert: 'test', documents: [{_id: 1, title: 'foo'}]});
    });

    afterEach(async () => {
      await engine.command(ns, {drop: 'test'});
    });

    it('should insert remaining documents after initial fail when not ordered', async () => {
      const result = await engine.command(ns, {
        insert: 'test',
        documents: [{_id: 1, title: 'foo'}, {_id: 2, title: 'bar'}],
      });
      expect(result).to.eql({n: 1, ok: 1, writeErrors: [{index: 0, errMsg: 'Duplicate id', errInfo: undefined}]});
    });

    it('should not insert remaining documents after initial fail when ordered', async () => {
      const result = await engine.command(ns, {
        insert: 'test',
        documents: [{_id: 1, title: 'foo'}, {_id: 2, title: 'bar'}],
        ordered: true,
      });
      expect(result).to.eql({n: 0, ok: 1, writeErrors: [{index: 0, errMsg: 'Duplicate id', errInfo: undefined}]});
    });
  });
});
