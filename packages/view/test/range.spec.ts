/*
import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';
import {Range, MemoryCollection} from '../../../src';

chai.use(chaiAsPromised);

const data = [
  {_id: 1, item: { category: 'cake', type: 'chiffon' }, amount: 10 },
  {_id: 2, item: { category: 'cookies', type: 'chocolate chip'}, amount: 50 },
  {_id: 3, item: { category: 'cookies', type: 'chocolate chip'}, amount: 15 },
  {_id: 4, item: { category: 'cake', type: 'lemon' }, amount: 30 },
  {_id: 5, item: { category: 'cake', type: 'carrot' }, amount: 20 },
];

describe('Range', () => {

  class RangeWithoutLimit extends Range {
    public offset = 2;
  }

  let collection = new MemoryCollection('test');
  let range2: RangeWithoutLimit;

  before(async () => {
    range1 = new RangeWithLimit(collection);
    for (let doc of data) {
      await collection.upsert(doc);
    }
  });

  describe('with limit', () => {
    class RangeWithLimit extends Range {
      public limit = 2;
      public offset = 2;
    }
    let range1: RangeWithLimit;

    it('should contain the correct documents', () => {
      expect(range1.data.map(d => d._id)).to.eql([3, 4]);
    });

    it('should have some documents excluded', () => {
      expect(range1.excludedCount).to.eql(3);
    });
  });

  describe('with limit', () => {
    it('should contain the correct documents', () => {
      expect(range1.data.map(d => d._id)).to.eql([3, 4]);
    });

    it('should have some documents excluded', () => {
      expect(range1.excludedCount).to.eql(3);
    });
  });
});
*/
