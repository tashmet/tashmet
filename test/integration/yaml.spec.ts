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

  describe('$objectToYaml', () => {
    it('should convert object to yaml using path expression', async () => {
      const input = [
        { object: { foo: 'bar' } }
      ];
      const pipeline: Document[] = [
        { $documents: input },
        { $set: { yaml: { $objectToYaml: '$object' } } }
      ];

      const doc = await tashmet.db('test').aggregate(pipeline).next();

      expect(doc).to.not.be.undefined;
      expect((doc as Document).yaml).to.eql('foo: bar\n');
    });

    it('should convert object to yaml using full expression', async () => {
      const input = [
        { object: { foo: 'bar' } }
      ];
      const pipeline: Document[] = [
        { $documents: input },
        { $set: { yaml: { $objectToYaml: { data: '$object' } } } }
      ];

      const doc = await tashmet.db('test').aggregate(pipeline).next();

      expect(doc).to.not.be.undefined;
      expect((doc as Document).yaml).to.eql('foo: bar\n');
    });
  });

  describe('$yamlToObject', () => {
    it('should convert yaml to object using path expression', async () => {
      const yaml = dedent`
        title: foo
        list:
          - item1
          - item2
      `;
      const pipeline: Document[] = [
        { $documents: [{ yaml }] },
        { $set: { object: { $yamlToObject: '$yaml' } } }
      ];

      const doc = await tashmet.db('test').aggregate(pipeline).next();

      expect(doc).to.not.be.undefined;
      expect((doc as Document).object).to.eql({title: 'foo', list: ['item1', 'item2']});
    });
  });
});
