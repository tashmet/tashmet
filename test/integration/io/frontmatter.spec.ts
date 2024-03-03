import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';
import dedent from 'dedent';

import Tashmet, { Document } from '@tashmet/tashmet';
import mingo from '../../../packages/mingo/dist/index.js';
import Nabu from '../../../packages/nabu/dist/index.js';
import { makeFileFormat } from '../../../packages/nabu/dist/format/index.js';

chai.use(chaiAsPromised);

const { expect } = chai;


describe('frontmatter', () => {
  let tashmet: Tashmet;

  before(async () => {
    const store = Nabu
      .configure({})
      .use(mingo())
      .bootstrap();

    tashmet = await Tashmet.connect(store.proxy());
  });

  async function readContent(content: string, format: string | Document) {
    const f = makeFileFormat(format);
    const pipeline: Document[] = [
      { $documents: [{ content }] },
      ...f.reader 
    ];
    return await tashmet.db('test').aggregate(pipeline).next();
  }

  function writeContent(content: Document, format: string | Document) {
    const f = makeFileFormat(format);
    const pipeline: Document[] = [
      { $documents: [{ content }] },
      ...f.writer 
    ];
    return tashmet.db('test').aggregate(pipeline).next() as Promise<Document>;
  }

  describe('input', () => {
    it('should convert frontmatter to object', async () => {
      const content = dedent`
        ---
        title: foo
        ---
        Document body
      `;
      const doc = await readContent(content, 'frontmatter');

      return expect(doc).to.eql({
        content: { body: 'Document body', frontmatter: 'title: foo' }
      });
    });

    it('should convert frontmatter to object with custom fields', async () => {
      const content = dedent`
        ---
        title: foo
        ---
        Document body
      `;
      const doc = await readContent(content, { frontmatter: { field: 'meta', bodyField: 'content' } });

      return expect(doc).to.eql({
        content: { content: 'Document body', meta: 'title: foo' }
      });
    });

    it('should convert json frontmatter to object', async () => {
      const content = dedent`
        ---
        { "title": "foo" }
        ---
        Document body
      `;
      const doc = await readContent(content, { frontmatter: 'json' });

      return expect(doc).to.eql({
        content: { body: 'Document body', title: 'foo' }
      });
    });

    it('should convert json frontmatter to object preserving field', async () => {
      const content = dedent`
        ---
        { "title": "foo" }
        ---
        Document body
      `;
      const doc = await readContent(content, { frontmatter: { format: 'json', root: false} });

      return expect(doc).to.eql({
        content: { body: 'Document body', frontmatter: { title: 'foo' } }
      });
    });

    it('should convert yaml frontmatter to object', async () => {
      const content = dedent`
        ---
        title: foo
        ---
        Document body
      `;
      const doc = await readContent(content, { frontmatter: 'yaml' });

      return expect(doc).to.eql({
        content: { body: 'Document body', title: 'foo' }
      });
    });

    it('should convert yaml frontmatter to object preserving field', async () => {
      const content = dedent`
        ---
        title: foo
        ---
        Document body
      `;
      const doc = await readContent(content, { frontmatter: { format: 'yaml', root: false } });

      return expect(doc).to.eql({
        content: { body: 'Document body', frontmatter: { title: 'foo' } }
      });
    });
  });

  describe('output', () => {
    it('should convert object to frontmatter', async () => {
      const expected = dedent`
        ---
        title: foo
        ---
        Document body
      `;
      const content = { body: 'Document body', frontmatter: 'title: foo' };
      const doc = await writeContent(content, 'frontmatter');

      return expect(doc.content).to.equal(expected);
    });

    it('should convert object to frontmatter with custom fields', async () => {
      const expected = dedent`
        ---
        title: foo
        ---
        Document body
      `;
      const content = { content: 'Document body', meta: 'title: foo' };
      const doc = await writeContent(content, { frontmatter: { field: 'meta', bodyField: 'content' } });

      return expect(doc.content).to.equal(expected);
    });

    it('should convert object to json frontmatter', async () => {
      const expected = dedent`
        ---
        {
          "title": "foo"
        }
        ---
        Document body
      `;
      const content = { body: 'Document body', title: 'foo' };
      const doc = await writeContent(content, { frontmatter: 'json' });

      return expect(doc.content).to.equal(expected);
    });

    it('should convert object with preserved field to json frontmatter', async () => {
      const expected = dedent`
        ---
        {
          "title": "foo"
        }
        ---
        Document body
      `;
      const content = { body: 'Document body', frontmatter: { title: 'foo' } }
      const doc = await writeContent(content, { frontmatter: { format: 'json', root: false} });

      return expect(doc.content).to.equal(expected);
    });

    it('should convert object to yaml frontmatter', async () => {
      const expected = dedent`
        ---
        title: foo
        ---
        Document body
      `;
      const content = { body: 'Document body', title: 'foo' };
      const doc = await writeContent(content, { frontmatter: 'yaml' });

      return expect(doc.content).to.equal(expected);
    });

    it('should convert object with preserved field to yaml frontmatter', async () => {
      const expected = dedent`
        ---
        title: foo
        ---
        Document body
      `;
      const content = { body: 'Document body', frontmatter: { title: 'foo' } };
      const doc = await writeContent(content, { frontmatter: { format: 'yaml', root: false} });

      return expect(doc.content).to.equal(expected);
    });
  });
});
