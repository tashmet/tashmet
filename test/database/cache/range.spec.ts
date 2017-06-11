import {Range, RangeSet, RangeEvaluator} from '../../../src/database/cache/range';
import {expect} from 'chai';
import 'mocha';

describe('Range', () => {
  describe('containment', () => {
    it('should contain itself', () => {
      const r = new Range(0, 2);

      expect(r.contains(r)).to.equal(true);
    });
    it('should contain a shorter range with same start', () => {
      const r1 = new Range(0, 2);
      const r2 = new Range(0, 1);

      expect(r1.contains(r2)).to.equal(true);
    });
    it('should contain a shorter range with same end', () => {
      const r1 = new Range(0, 2);
      const r2 = new Range(1, 2);

      expect(r1.contains(r2)).to.equal(true);
    });
    it('should not contain a range with lower start', () => {
      const r1 = new Range(1, 2);
      const r2 = new Range(0, 2);

      expect(r1.contains(r2)).to.equal(false);
    });
    it('should not contain a range with higher end', () => {
      const r1 = new Range(1, 2);
      const r2 = new Range(1, 3);

      expect(r1.contains(r2)).to.equal(false);
    });
    it('should not contain a range fully outside', () => {
      const r1 = new Range(1, 2);
      const r2 = new Range(3, 4);

      expect(r1.contains(r2)).to.equal(false);
    });
  });

  describe('overlap length', () => {
    it('should be equal to own length when overlaped with itself', () => {
      const r = new Range(0, 2);

      expect(r.overlapLength(r)).to.equal(3);
    });
    it('should be equal to length of smallest range when fully overlapping', () => {
      const r1 = new Range(0, 2);
      const r2 = new Range(1, 2);

      expect(r1.overlapLength(r2)).to.equal(2);
    });
    it('should be accurate when overlapping at beginning', () => {
      const r1 = new Range(1, 2);
      const r2 = new Range(0, 1);

      expect(r1.overlapLength(r2)).to.equal(1);
    });
    it('should be accurate when overlapping at end', () => {
      const r1 = new Range(1, 2);
      const r2 = new Range(1, 5);

      expect(r1.overlapLength(r2)).to.equal(2);
    });
    it('should be zero when ranges do not overlap', () => {
      const r1 = new Range(1, 2);
      const r2 = new Range(3, 5);

      expect(r1.overlapLength(r2)).to.equal(0);
    });
  });
});

describe('RangeSet', () => {
  it('should add a range to the set', () => {
    const set = new RangeSet();
    const r = new Range(0, 2);
    set.add(r);

    expect(set.size()).to.equal(1);
    expect(set.contains(r)).to.equal(true);
  });
  it('should merge an overlapping range', () => {
    const set = new RangeSet();
    set.add(new Range(0, 2));
    set.add(new Range(1, 4));

    expect(set.size()).to.equal(1);
    expect(set.contains(new Range(0, 4))).to.equal(true);
  });
  it('should merge a fully covering range', () => {
    const set = new RangeSet();
    set.add(new Range(2, 4));
    set.add(new Range(0, 6));

    expect(set.size()).to.equal(1);
    expect(set.contains(new Range(0, 6))).to.equal(true);
  });
  it('should merge a fully covered range', () => {
    const set = new RangeSet();
    set.add(new Range(0, 6));
    set.add(new Range(2, 4));

    expect(set.size()).to.equal(1);
    expect(set.contains(new Range(0, 6))).to.equal(true);
  });

  describe('fragmented range set', () => {
    const set = new RangeSet();
    set.add(new Range(0, 2));
    set.add(new Range(5, 6));

    it('should have correct size', () => {
      expect(set.size()).to.equal(2);
    });
    it('should contain each range', () => {
      expect(set.contains(new Range(0, 2))).to.equal(true);
      expect(set.contains(new Range(5, 6))).to.equal(true);
    });
    it('should not contain other ranges', () => {
      expect(set.contains(new Range(3, 4))).to.equal(false);
      expect(set.contains(new Range(0, 5))).to.equal(false);
    });
    it('should merge one overlapping range', () => {
      set.add(new Range(6, 7));

      expect(set.size()).to.equal(2);
      expect(set.contains(new Range(5, 7))).to.equal(true);
    });
    it('should merge into single range', () => {
      set.add(new Range(1, 8));

      expect(set.size()).to.equal(1);
      expect(set.contains(new Range(0, 8))).to.equal(true);
      expect(set.contains(new Range(4, 9))).to.equal(false);
    });
  });
});