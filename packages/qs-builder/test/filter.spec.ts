import {expect} from 'chai';
import 'mocha';
import {QueryStringWriter, lhsBrackets, lhsColon, rhsColon} from '../src';

describe('flatFilter', () => {
  it('should serialize using LHSBrackets', async () => {
    const filter = {
      'item.amount': {$gte: 2, $lte: 10},
    }
    expect(new QueryStringWriter({filter}).flatFilter({format: lhsBrackets}))
      .to.eql('item.amount[gte]=2&item.amount[lte]=10');
  });

  it('should serialize using LHSColon', async () => {
    const filter = {
      'item.amount': {$gte: 2, $lte: 10},
    }
    expect(new QueryStringWriter({filter}).flatFilter({format: lhsColon}))
      .to.eql('item.amount:gte=2&item.amount:lte=10');
  });

  it('should serialize using RHSColon', async () => {
    const filter = {
      'item.amount': {$gte: 2, $lte: 10},
    }
    expect(new QueryStringWriter({filter}).flatFilter({format: rhsColon}))
      .to.eql('item.amount=gte:2&item.amount=lte:10');
  });

  it('should serialize equality without operator', async () => {
    const filter = {
      category: 'foo',
    }
    expect(new QueryStringWriter({filter}).flatFilter({format: lhsColon}))
      .to.eql('category=foo');
  });

  it('should simplify equality operator', async () => {
    const filter = {
      category: {$eq: 'foo'},
    }
    expect(new QueryStringWriter({filter}).flatFilter({format: lhsColon}))
      .to.eql('category=foo');
  });

  it('should url-encode special characters', async () => {
    const filter = {
      title: 'Hello World',
    }
    expect(new QueryStringWriter({filter}).flatFilter({format: lhsColon}))
      .to.eql('title=Hello%20World');
  });

  it('should serialize array operations', async () => {
    const filter = {
      category: {$in: ['foo', 'bar']},
    }
    expect(new QueryStringWriter({filter}).flatFilter({format: lhsColon}))
      .to.eql('category:in=foo,bar');
  });

  it('should serialize array equality', async () => {
    const filter = {
      category: ['foo', 'bar'],
    }
    expect(new QueryStringWriter({filter}).flatFilter({format: lhsColon}))
      .to.eql('category=foo,bar');
  });
});

describe('nestedFilter', () => {
  it('should serialize filter with default root', async () => {
    const filter = {
      foo: {$eq: 2},
    }
    expect(new QueryStringWriter({filter}).nestedFilter())
      .to.eql('filter[foo][%24eq]=2');
  });

  it('should serialize filter with custom root', async () => {
    const filter = {
      foo: {$eq: 2},
    }
    expect(new QueryStringWriter({filter}).nestedFilter({root: 'selector'}))
      .to.eql('selector[foo][%24eq]=2');
  });

  it('should serialize filter without root', async () => {
    const filter = {
      'item.amount': {$gte: 2, $lte: 10},
    }
    expect(new QueryStringWriter({filter}).nestedFilter({root: false}))
      .to.eql('item.amount[%24gte]=2&item.amount[%24lte]=10');
  });
});
