/*
import {fromYaml, toYaml} from '../../../src/pipes/yaml';
import {expect} from 'chai';
import 'mocha';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import dedent from 'dedent';

chai.use(chaiAsPromised);

describe('yaml', () => {
  describe('deserialize', () => {
    it('should provide a plain object for valid yaml', () => {
      const parse = fromYaml();
      const yaml = dedent`
        title: foo
        list:
          - item1
          - item2
      `;
      return parse(Buffer.from(yaml, 'utf-8')).then(obj => {
        expect(obj).to.eql({title: 'foo', list: ['item1', 'item2']});
      });
    });

    it('should reject promise with error for invalid yaml', () => {
      const parse = fromYaml()
      const yaml = dedent`
        foo: *unknownAlias
      `;
      return expect(parse(Buffer.from(yaml, 'utf-8'))).to.be.rejectedWith(Error);
    });

    it('should handle yaml front matter', () => {
      const parse = fromYaml({frontMatter: true});
      const yaml = dedent`
        ---
        title: foo
        ---
        Content goes here
      `;
      return parse(Buffer.from(yaml, 'utf-8')).then(obj => {
        expect(obj).to.eql({title: 'foo', _content: 'Content goes here'});
      });
    });

    it('should store content under custom key', () => {
      const parse = fromYaml({frontMatter: true, contentKey: 'text'});
      const yaml = dedent`
        ---
        title: foo
        ---
        Content goes here
      `;
      return parse(Buffer.from(yaml, 'utf-8')).then(obj => {
        expect(obj).to.eql({title: 'foo', text: 'Content goes here'});
      });
    });
  });

  describe('serialize', () => {
    it('should provide yaml data for a plain object', () => {
      const serialize = toYaml();
      const plain = {title: 'foo', list: ['item1', 'item2']};
      const expected = dedent`
        title: foo
        list:
          - item1
          - item2
      `;
      return serialize(plain).then(output => {
        expect(output.toString('utf-8').trim()).to.eql(expected.trim());
      });
    });

    it('should handle yaml front matter', () => {
      const serialize = toYaml({frontMatter: true});
      const plain = {title: 'foo', _content: 'Content goes here'};
      const expected = dedent`
        ---
        title: foo
        ---
        Content goes here
      `;
      return serialize(plain).then(output => {
        expect(output.toString('utf-8').trim()).to.eql(expected.trim());
      });
    });

    it('should serialize content under custom key', () => {
      const serialize = toYaml({frontMatter: true, contentKey: 'text'});
      const plain = {title: 'foo', text: 'Content goes here'};
      const expected = dedent`
        ---
        title: foo
        ---
        Content goes here
      `;
      return serialize(plain).then(output => {
        expect(output.toString('utf-8').trim()).to.eql(expected.trim());
      });
    });
  });
});
*/
