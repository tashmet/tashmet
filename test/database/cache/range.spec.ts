import {Range, RangeEvaluator} from '../../../src/database/cache/range';
import {expect} from 'chai';
import 'mocha';

describe('Range', () => {
  describe('containment', () => {
    it('should contain itself', () => {
      let r = new Range(0, 2);

      expect(r.contains(r)).to.equal(true);
    });
    it('should contain a shorter range with same start', () => {
      let r1 = new Range(0, 2);
      let r2 = new Range(0, 1);

      expect(r1.contains(r2)).to.equal(true);
    });
    it('should contain a shorter range with same end', () => {
      let r1 = new Range(0, 2);
      let r2 = new Range(1, 2);

      expect(r1.contains(r2)).to.equal(true);
    });
    it('should not contain a range with lower start', () => {
      let r1 = new Range(1, 2);
      let r2 = new Range(0, 2);

      expect(r1.contains(r2)).to.equal(false);
    });
    it('should not contain a range with higher end', () => {
      let r1 = new Range(1, 2);
      let r2 = new Range(1, 3);

      expect(r1.contains(r2)).to.equal(false);
    });
    it('should not contain a range fully outside', () => {
      let r1 = new Range(1, 2);
      let r2 = new Range(3, 4);

      expect(r1.contains(r2)).to.equal(false);
    });
  });

  describe('overlap length', () => {
    it('should be equal to own length when overlaped with itself', () => {
      let r = new Range(0, 2);

      expect(r.overlapLength(r)).to.equal(3);
    });
    it('should be equal to length of smallest range when fully overlapping', () => {
      let r1 = new Range(0, 2);
      let r2 = new Range(1, 2);

      expect(r1.overlapLength(r2)).to.equal(2);
    });
    it('should be accurate when overlapping at beginning', () => {
      let r1 = new Range(1, 2);
      let r2 = new Range(0, 1);

      expect(r1.overlapLength(r2)).to.equal(1);
    });
    it('should be accurate when overlapping at end', () => {
      let r1 = new Range(1, 2);
      let r2 = new Range(1, 5);

      expect(r1.overlapLength(r2)).to.equal(2);
    });
    it('should be zero when ranges do not overlap', () => {
      let r1 = new Range(1, 2);
      let r2 = new Range(3, 5);

      expect(r1.overlapLength(r2)).to.equal(0);
    });
  });
});
