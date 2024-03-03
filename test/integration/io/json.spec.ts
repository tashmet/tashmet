import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import Tashmet from '@tashmet/tashmet';
import mingo from '../../../packages/mingo/dist/index.js';
import Nabu from '../../../packages/nabu/dist/index.js';
import { IOHelper } from './io-helper.js';

chai.use(chaiAsPromised);

const { expect } = chai;

describe('json', () => {
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
    it('should convert json to object', async () => {
      const content = '{ "foo": "bar" }';
      const doc = await io.readContent(content, 'json');

      return expect(doc).to.eql({
        content: { foo: 'bar' }
      });
    });
  });

  describe('output', () => {
    it('should convert object to json', async () => {
      const expected = '{\n  "foo": "bar"\n}';
      const content = { foo: 'bar' };
      const doc = await io.writeContent(content, 'json');

      return expect(doc.content).to.equal(expected);
    });
  });
});
