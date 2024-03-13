import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import Tashmet from '@tashmet/tashmet';
import mingo from '../../../packages/mingo/dist/index.js';
import Nabu from '@tashmet/nabu';
import { IOHelper } from './io-helper.js';
import { Fill } from '@tashmet/nabu/dist/io/fill.js';

chai.use(chaiAsPromised);

const { expect } = chai;

describe('FillIO', () => {
  let io: IOHelper;

  before(async () => {
    const store = Nabu
      .configure({})
      .use(mingo())
      .bootstrap();

    const tashmet = await Tashmet.connect(store.proxy());
    io = new IOHelper(tashmet);
  });

  describe('input', () => {
    it('should fill in undefined fields', async () => {
      const content = { content: { foo: undefined } };
      const output = await io.input([content], new Fill({ foo: 'bar' })).next();

      return expect(output).to.eql({ content: { foo: 'bar' } });
    });

    it('should fill in null fields', async () => {
      const content = { content: { foo: null } };
      const output = await io.input([content], new Fill({ foo: 'bar' })).next();

      return expect(output).to.eql({ content: { foo: 'bar' } });
    });

    it('should not fill in defined fields', async () => {
      const content = { content: { foo: 'baz' } };
      const output = await io.input([content], new Fill({ foo: 'bar' })).next();

      return expect(output).to.eql({ content: { foo: 'baz' } });
    });
  });

  describe('output', () => {
    it('should remove fields with default value', async () => {
      const content = { content: { foo: 'bar' } };
      const output = await io.output([content], new Fill({ foo: 'bar' })).next();

      return expect(output).to.eql({ content: {} });
    });
    it('should remove fields with null value', async () => {
      const content = { content: { foo: null } };
      const output = await io.output([content], new Fill({ foo: 'bar' })).next();

      return expect(output).to.eql({ content: {} });
    });
    it('should keep fields with non-default value', async () => {
      const content = { content: { foo: 'baz' } };
      const output = await io.output([content], new Fill({ foo: 'bar' })).next();

      return expect(output).to.eql({ content: { foo: 'baz' } });
    });
  });
});
