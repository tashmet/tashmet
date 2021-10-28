import {expect} from 'chai';
import 'mocha';
import {QueryStringWriter} from '../src';

describe('delimitedProjection', () => {
  it('should serialize single projection field', async () => {
    const projection = {
      'item.amount': true,
    }
    expect(new QueryStringWriter({projection}).delimitedProjection())
      .to.eql('projection=item.amount');
  });

  it('should serialize mixed include and exclude projection', async () => {
    const projection = {
      foo: true,
      bar: false,
    }
    expect(new QueryStringWriter({projection}).delimitedProjection())
      .to.eql('projection=foo');
  });

  it('should omit _id when set to false', async () => {
    const projection = {
      _id: false,
      foo: true,
    }
    expect(new QueryStringWriter({projection}).delimitedProjection())
      .to.eql('projection=foo');
  });

  it('should omit _id when set to true', async () => {
    const projection = {
      _id: true,
      foo: true,
    }
    expect(new QueryStringWriter({projection}).delimitedProjection())
      .to.eql('projection=foo');
  });

  it('should serialize projection with only excluded fields', async () => {
    const projection = {
      foo: false,
      bar: false,
    }
    expect(
      new QueryStringWriter({projection}).delimitedProjection({
        param: include => include ? 'include' : 'exclude',
        exclude: f => f,
      })
    ).to.eql('exclude=foo,bar');
  });

  it('should serialize projection with custom format', async () => {
    const projection = {
      foo: true,
      bar: true,
    }
    expect(
      new QueryStringWriter({projection}).delimitedProjection({
        param: 'fields',
        separator: ';'
      })
    ).to.eql('fields=foo;bar');
  });

  it('should serialize to empty string if no fields are outputed', async () => {
    const projection = {
      foo: undefined,
    }
    expect(new QueryStringWriter({projection}).delimitedProjection())
      .to.eql('');
  });
});

describe('nestedProjection', () => {
  it('should serialize projection with default configuration', async () => {
    const projection = {
      foo: true,
      bar: false,
    }
    expect(new QueryStringWriter({projection}).nestedProjection())
      .to.eql('projection[foo]=1&projection[bar]=0');
  });

  it('should serialize projection with custom configuration', async () => {
    const projection = {
      foo: true,
      bar: false,
    }
    expect(new QueryStringWriter({projection}).nestedProjection({param: 'fields', value: v => v}))
      .to.eql('fields[foo]=true&fields[bar]=false');
  });

  it('should serialize projection with purged undefined fields', async () => {
    const projection = {
      foo: true,
      bar: undefined,
    }
    expect(new QueryStringWriter({projection}).nestedProjection())
      .to.eql('projection[foo]=1');
  });

  it('should serialize to empty string with empty projection', async () => {
    const projection = {
      bar: undefined,
    }
    expect(new QueryStringWriter({projection}).nestedProjection())
      .to.eql('');
  });
});
