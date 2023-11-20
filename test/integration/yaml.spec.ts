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
        { $set: { yaml: { $objectToYaml: { path: '$object' } } } }
      ];

      const doc = await tashmet.db('test').aggregate(pipeline).next();

      expect(doc).to.not.be.undefined;
      expect((doc as Document).yaml).to.eql('foo: bar\n');
    });

    it('should handle yaml front matter with default contentKey', async () => {
      const input = [
        { object: { title: 'foo', _content: 'Content goes here' } }
      ];
      const pipeline: Document[] = [
        { $documents: input },
        { $set: { yaml: { $objectToYaml: { path: '$object', frontMatter: true } } } }
      ];
      const expected = dedent`
        ---
        title: foo
        ---
        Content goes here
      `;

      const doc = await tashmet.db('test').aggregate(pipeline).next();

      expect(doc).to.not.be.undefined;
      expect((doc as Document).yaml).to.eql(expected.trim());
    });

    it('should handle yaml front matter with nested contentKey', async () => {
      const input = [
        { object: { title: 'foo', body: { raw: 'Content goes here' } } }
      ];
      const pipeline: Document[] = [
        { $documents: input },
        { $set: { yaml: { $objectToYaml: { path: '$object', frontMatter: true, contentKey: 'body.raw' } } } }
      ];
      const expected = dedent`
        ---
        title: foo
        body: {}
        ---
        Content goes here
      `;

      const doc = await tashmet.db('test').aggregate(pipeline).next();

      expect(doc).to.not.be.undefined;
      expect((doc as Document).yaml).to.eql(expected.trim());
    });

    it('should handle yaml front matter with custom contentKey', async () => {
      const input = [
        { object: { title: 'foo', body: 'Content goes here' } }
      ];
      const pipeline: Document[] = [
        { $documents: input },
        { $set: { yaml: { $objectToYaml: { path: '$object', frontMatter: true, contentKey: 'body' } } } }
      ];
      const expected = dedent`
        ---
        title: foo
        ---
        Content goes here
      `;

      const doc = await tashmet.db('test').aggregate(pipeline).next();

      expect(doc).to.not.be.undefined;
      expect((doc as Document).yaml).to.eql(expected.trim());
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

    it('should convert yaml to object using full expression', async () => {
      const yaml = dedent`
        title: foo
        list:
          - item1
          - item2
      `;
      const pipeline: Document[] = [
        { $documents: [{ yaml }] },
        { $set: { object: { $yamlToObject: { path: '$yaml' } } } }
      ];

      const doc = await tashmet.db('test').aggregate(pipeline).next();

      expect(doc).to.not.be.undefined;
      expect((doc as Document).object).to.eql({title: 'foo', list: ['item1', 'item2']});
    });

    it('should handle yaml front matter with default contentKey', async () => {
      const yaml = dedent`
        ---
        title: foo
        ---
        Content goes here
      `;
      const pipeline: Document[] = [
        { $documents: [{ yaml }] },
        { $set: { object: { $yamlToObject: { path: '$yaml', frontMatter: true } } } }
      ];
      const doc = await tashmet.db('test').aggregate(pipeline).next();

      expect(doc).to.not.be.undefined;
      expect((doc as Document).object).to.eql({title: 'foo', _content: 'Content goes here'});
    });

    it('should handle yaml front matter with custom contentKey', async () => {
      const yaml = dedent`
        ---
        title: foo
        ---
        Content goes here
      `;
      const pipeline: Document[] = [
        { $documents: [{ yaml }] },
        { $set: { object: { $yamlToObject: { path: '$yaml', frontMatter: true, contentKey: 'body' } } } }
      ];
      const doc = await tashmet.db('test').aggregate(pipeline).next();

      expect(doc).to.not.be.undefined;
      expect((doc as Document).object).to.eql({title: 'foo', body: 'Content goes here'});
    });

    it('should handle yaml front matter with nested contentKey', async () => {
      const yaml = dedent`
        ---
        title: foo
        ---
        Content goes here
      `;
      const pipeline: Document[] = [
        { $documents: [{ yaml }] },
        { $set: { object: { $yamlToObject: { path: '$yaml', frontMatter: true, contentKey: 'body.raw' } } } }
      ];
      const doc = await tashmet.db('test').aggregate(pipeline).next();

      expect(doc).to.not.be.undefined;
      expect((doc as Document).object).to.eql({title: 'foo', body: { raw: 'Content goes here'} });
    });
  });
});
