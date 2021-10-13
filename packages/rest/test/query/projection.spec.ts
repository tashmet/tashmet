import {expect} from 'chai';
import 'mocha';
import {delimitedProjection, nestedProjection} from '../../src/query/projection';

describe('delimitedProjection', () => {
  it('should serialize single projection field', async () => {
    const s = delimitedProjection();
    const projection = {
      'item.amount': true,
    }
    expect(s({projection})).to.eql('projection=item.amount');
  });

  it('should serialize mixed include and exclude projection', async () => {
    const s = delimitedProjection();
    const projection = {
      foo: true,
      bar: false,
    }
    expect(s({projection})).to.eql('projection=foo');
  });

  it('should omit _id when set to false', async () => {
    const s = delimitedProjection();
    const projection = {
      _id: false,
      foo: true,
    }
    expect(s({projection})).to.eql('projection=foo');
  });

  it('should omit _id when set to true', async () => {
    const s = delimitedProjection();
    const projection = {
      _id: true,
      foo: true,
    }
    expect(s({projection})).to.eql('projection=foo');
  });

  it('should serialize projection with only excluded fields', async () => {
    const s = delimitedProjection({
      param: include => include ? 'include' : 'exclude',
      exclude: f => f,
    });
    const projection = {
      foo: false,
      bar: false,
    }
    expect(s({projection})).to.eql('exclude=foo,bar');
  });

  it('should serialize projection with custom format', async () => {
    const s = delimitedProjection({
      param: 'fields',
      separator: ';',
    });
    const projection = {
      foo: true,
      bar: true,
    }
    expect(s({projection})).to.eql('fields=foo;bar');
  });

  it('should serialize to empty string if no fields are outputed', async () => {
    const s = delimitedProjection({});
    const projection = {
      foo: undefined,
    }
    expect(s({projection})).to.eql('');
  });
});

describe('nestedProjection', () => {
  it('should serialize projection with default configuration', async () => {
    const s = nestedProjection();
    const projection = {
      foo: true,
      bar: false,
    }
    expect(s({projection})).to.eql('projection[foo]=1&projection[bar]=0');
  });

  it('should serialize projection with custom configuration', async () => {
    const s = nestedProjection({
      param: 'fields',
      value: v => v,
    });
    const projection = {
      foo: true,
      bar: false,
    }
    expect(s({projection})).to.eql('fields[foo]=true&fields[bar]=false');
  });

  it('should serialize projection with purged undefined fields', async () => {
    const s = nestedProjection();
    const projection = {
      foo: true,
      bar: undefined,
    }
    expect(s({projection})).to.eql('projection[foo]=1');
  });

  it('should serialize to empty string with empty projection', async () => {
    const s = nestedProjection();
    const projection = {
      bar: undefined,
    }
    expect(s({projection})).to.eql('');
  });
});
