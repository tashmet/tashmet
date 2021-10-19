import {expect} from 'chai';
import 'mocha';
import {flatFilter, lhsBrackets, lhsColon, rhsColon, nestedFilter} from '../../src/query/filter';

describe('flatFilter', () => {
  it('should serialize using LHSBrackets', async () => {
    const s = flatFilter({format: lhsBrackets});
    const filter = {
      'item.amount': {$gte: 2, $lte: 10},
    }
    expect(s({filter})).to.eql('item.amount[gte]=2&item.amount[lte]=10');
  });

  it('should serialize using LHSColon', async () => {
    const s = flatFilter({format: lhsColon});
    const filter = {
      'item.amount': {$gte: 2, $lte: 10},
    }
    expect(s({filter})).to.eql('item.amount:gte=2&item.amount:lte=10');
  });

  it('should serialize using RHSColon', async () => {
    const s = flatFilter({format: rhsColon});
    const filter = {
      'item.amount': {$gte: 2, $lte: 10},
    }
    expect(s({filter})).to.eql('item.amount=gte:2&item.amount=lte:10');
  });

  it('should serialize equality without operator', async () => {
    const s = flatFilter({format: lhsColon});
    const filter = {
      category: 'foo',
    }
    expect(s({filter})).to.eql('category=foo');
  });

  it('should simplify equality operator', async () => {
    const s = flatFilter({format: lhsColon});
    const filter = {
      category: {$eq: 'foo'},
    }
    expect(s({filter})).to.eql('category=foo');
  });

  it('should url-encode special characters', async () => {
    const s = flatFilter({format: lhsColon});
    const filter = {
      title: 'Hello World',
    }
    expect(s({filter})).to.eql('title=Hello%20World');
  });

  it('should serialize array operations', async () => {
    const s = flatFilter({format: lhsColon});
    const filter = {
      category: {$in: ['foo', 'bar']},
    }
    expect(s({filter})).to.eql('category:in=foo,bar');
  });

  it('should serialize array equality', async () => {
    const s = flatFilter({format: lhsColon});
    const filter = {
      category: ['foo', 'bar'],
    }
    expect(s({filter})).to.eql('category=foo,bar');
  });
});

describe('nestedFilter', () => {
  it('should serialize filter with default root', async () => {
    const s = nestedFilter();
    const filter = {
      foo: {$eq: 2},
    }
    expect(s({filter})).to.eql('filter[foo][%24eq]=2');
  });

  it('should serialize filter with custom root', async () => {
    const s = nestedFilter({
      root: 'selector'
    });
    const filter = {
      foo: {$eq: 2},
    }
    expect(s({filter})).to.eql('selector[foo][%24eq]=2');
  });

  it('should serialize filter without root', async () => {
    const s = nestedFilter({
      root: false,
    });
    const filter = {
      'item.amount': {$gte: 2, $lte: 10},
    }
    expect(s({filter})).to.eql('item.amount[%24gte]=2&item.amount[%24lte]=10');
  });
});
