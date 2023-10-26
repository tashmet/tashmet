import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';
import dedent from 'dedent';

import Tashmet, { Document } from '../../packages/tashmet/dist/index.js';
import mingo from '../../packages/mingo/dist/index.js';
import Memory from '../../packages/memory/dist/index.js';
import yaml from '../../packages/yaml/dist/index.js';
import 'mingo/init/system';

chai.use(chaiAsPromised);

const { expect } = chai;

describe('yaml', () => {
  let tashmet: Tashmet;

  before(async () => {
    const store = Memory
      .configure({})
      .use(mingo())
      .use(yaml())
      .bootstrap();

    tashmet = await Tashmet.connect(store.proxy());
  })

  it('should convert object to yaml', async () => {
    const input = [
      { object: { foo: 'bar' } }
    ];
    const pipeline: Document[] = [
      { $set: { yaml: { $objectToYaml: '$object' } } }
    ];

    const doc = await tashmet.aggregate(input, pipeline).next();

    expect(doc).to.not.be.undefined;
    expect((doc as Document).yaml).to.eql('foo: bar\n');
  });

  it('should convert yaml to object', async () => {
    const yaml = dedent`
      title: foo
      list:
        - item1
        - item2
    `;
    const pipeline: Document[] = [
      { $set: { object: { $yamlToObject: '$yaml' } } }
    ];

    const doc = await tashmet.aggregate([{ yaml }], pipeline).next();

    expect(doc).to.not.be.undefined;
    expect((doc as Document).object).to.eql({title: 'foo', list: ['item1', 'item2']});
  });
});
