import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import Tashmet from '@tashmet/tashmet';
import mingo from '../../../packages/mingo/dist/index.js';
import Nabu from '../../../packages/nabu/dist/index.js';
import { IOHelper } from './io-helper.js';
import { ObjectIO } from '@tashmet/nabu/dist/io/objectInFile.js';

chai.use(chaiAsPromised);

const { expect } = chai;

describe('ObjectIO', () => {
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
    it('should convert object to documents', async () => {
      const content = { content: { doc1: { foo: 'bar' }, doc2: { baz: 'qux' } } };
      const docs = await io.input([content], new ObjectIO()).toArray();

      return expect(docs).to.eql([
        { _id: 'doc1', foo: 'bar' },
        { _id: 'doc2', baz: 'qux' }
      ]);
    });
  });

  describe('output', () => {
    it('should convert documents to object', async () => {
      const docs = [
        { _id: 'doc1', foo: 'bar' },
        { _id: 'doc2', baz: 'qux' }
      ];
      const content = await io.output(docs, new ObjectIO()).toArray();

      return expect(content).to.eql([{ content: { doc1: { foo: 'bar' }, doc2: { baz: 'qux' } } }]);
    });
  });
});
