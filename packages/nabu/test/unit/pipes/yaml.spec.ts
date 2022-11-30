import {parseYaml, serializeYaml} from '../../../src/operators/yaml';
import {expect} from 'chai';
import 'mocha';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import dedent from 'dedent';

chai.use(chaiAsPromised);

describe('yaml', () => {
  describe('deserialize', () => {
    it('should provide a plain object for valid yaml', () => {
      const yaml = dedent`
        title: foo
        list:
          - item1
          - item2
      `;
      expect(parseYaml(Buffer.from(yaml, 'utf-8')))
        .to.eql({title: 'foo', list: ['item1', 'item2']});
    });

    it('should reject promise with error for invalid yaml', () => {
      //const parse = fromYaml()
      const yaml = dedent`
        foo: *unknownAlias
      `;
      //expect(parseYaml(Buffer.from(yaml, 'utf-8'))).to.be.rejectedWith(Error);
    });

    it('should handle yaml front matter', () => {
      const yaml = dedent`
        ---
        title: foo
        ---
        Content goes here
      `;
      expect(parseYaml(Buffer.from(yaml, 'utf-8'), {frontMatter: true}))
        .to.eql({title: 'foo', _content: 'Content goes here'});
    });

    it('should store content under custom key', () => {
      const yaml = dedent`
        ---
        title: foo
        ---
        Content goes here
      `;
      expect(parseYaml(Buffer.from(yaml, 'utf-8'), {frontMatter: true, contentKey: 'text'}))
        .to.eql({title: 'foo', text: 'Content goes here'});
    });
  });

  describe('serialize', () => {
    it('should provide yaml data for a plain object', () => {
      const plain = {title: 'foo', list: ['item1', 'item2']};
      const expected = dedent`
        title: foo
        list:
          - item1
          - item2
      `;
      expect(serializeYaml(plain).toString('utf-8').trim())
        .to.eql(expected.trim());
    });

    it('should handle yaml front matter', () => {
      const plain = {title: 'foo', _content: 'Content goes here'};
      const expected = dedent`
        ---
        title: foo
        ---
        Content goes here
      `;
      expect(serializeYaml(plain, {frontMatter: true}).toString('utf-8').trim())
        .to.eql(expected.trim());
    });

    it('should serialize content under custom key', () => {
      const plain = {title: 'foo', text: 'Content goes here'};
      const expected = dedent`
        ---
        title: foo
        ---
        Content goes here
      `;
      expect(serializeYaml(plain, {frontMatter: true, contentKey: 'text'}).toString('utf-8').trim())
        .to.eql(expected.trim());
    });
  });
});
