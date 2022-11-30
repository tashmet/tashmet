/*
import { File, json } from '../../../src';
import {expect} from 'chai';
import 'mocha';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mingo/init/system';
import { Stream } from '../../../src/generators/stream';
import { Document } from '@tashmet/tashmet';

chai.use(chaiAsPromised);

describe('Stream', () => {
  describe('createBundle', () => {
    const collection = [
      {_id: 'doc1', title: 'foo'},
      {_id: 'doc2', title: 'bar'}
    ];

    describe('as list', () => {
      let output: File<Buffer>[];

      before(async () => {
        output = await Stream
          .fromArray(collection)
          .createBundle({path: 'test.json', serializer: json()})
          .toArray();
      });

      it('should output single file', async () => {
        expect(output.length).to.eql(1);
        expect(Object.keys(output[0])).to.eql(['path', 'content', 'isDir']);
      });

      it('should serialize to file with correct path', async () => {
        expect(output[0].path).to.eql('test.json');
      });

      it('should serialize to file with correct content', async () => {
        expect(output[0].content.toString('utf8'))
          .to.eql('[{"_id":"doc1","title":"foo"},{"_id":"doc2","title":"bar"}]');
      });
    });

    describe('as dictionary', () => {
      let output: File<Buffer>[];

      before(async () => {
        output = await Stream
          .fromArray(collection)
          .createBundle({path: 'test.json', serializer: json(), dictionary: true})
          .toArray();
      });

      it('should output single file', () => {
        expect(output.length).to.eql(1);
        expect(Object.keys(output[0])).to.eql(['path', 'content', 'isDir']);
      });

      it('should serialize to file with correct path', () => {
        expect(output[0].path).to.eql('test.json');
      });

      it('should serialize to file with correct content', () => {
        expect(output[0].content.toString('utf8'))
          .to.eql('{"doc1":{"title":"foo"},"doc2":{"title":"bar"}}');
      });
    });
  });

  describe('loadBundle', () => {
    const collection = [
      {_id: 'doc1', title: 'foo'},
      {_id: 'doc2', title: 'bar'}
    ];

    describe('as list', () => {
      const input = [
        {
          path: 'test.json',
          content: Buffer.from('[{"_id":"doc1","title":"foo"},{"_id":"doc2","title":"bar"}]'),
          isDir: false
        }
      ];
      let output: Document[];

      before(async () => {
        output = await Stream
          .fromArray(input)
          .loadBundle({path: 'test.json', serializer: json()})
          .toArray();
      });

      it('should output correct amount of documents', () => {
        expect(output.length).to.eql(2);
      });

      it('should parse file contents', () => {
        expect(output).to.eql(collection)
      });
    });

    describe('as dictionary', () => {
      const input = [
        {
          path: 'test.json',
          content: Buffer.from('{"doc1":{"title":"foo"},"doc2":{"title":"bar"}}'),
          isDir: false
        }
      ];
      let output: Document[];

      before(async () => {
        output = await Stream
          .fromArray(input)
          .loadBundle({path: 'test.json', serializer: json(), dictionary: true})
          .toArray();
      });

      it('should output correct amount of documents', () => {
        expect(output.length).to.eql(2);
      });

      it('should parse file contents', () => {
        expect(output).to.eql(collection)
      });
    });
  });

  describe('createFiles', () => {
    const collection = [
      {_id: 'doc1', title: 'foo'},
      {_id: 'doc2', title: 'bar'}
    ];
    let output: File<Buffer>[];

    before(async () => {
      output = await Stream
        .fromArray(collection)
        .createFiles({
          serializer: json(),
          path: doc => `collection/${doc._id}.json`,
        })
        .toArray();
    });

    it('should output correct amount of file', () => {
      expect(output.length).to.eql(2);
      expect(Object.keys(output[0])).to.eql(['path', 'content', 'isDir']);
    });

    it('should serialize to files with correct paths', () => {
      expect(output[0].path).to.eql('collection/doc1.json');
      expect(output[1].path).to.eql('collection/doc2.json');
    });

    it('should serialize to files with correct content', () => {
      expect(output[0].content.toString('utf8'))
        .to.eql('{"_id":"doc1","title":"foo"}');
      expect(output[1].content.toString('utf8'))
        .to.eql('{"_id":"doc2","title":"bar"}');
    });
  });

  describe('loadFiles', () => {
    const input = [
      {
        path: 'collections/doc1.json',
        content: Buffer.from('{"_id":"doc1","title":"foo"}'),
        isDir: false
      },
      {
        path: 'collections/doc2.json',
        content: Buffer.from('{"_id":"doc2","title":"bar"}'),
        isDir: false
      }
    ];
    let output: Document[];

    before(async () => {
      output = await Stream
        .fromArray(input)
        .loadFiles({
          serializer: json(),
          id: file => file.path.split('/')[1].split('.')[0],
        })
        .toArray();
    });

    it('should output correct amount of documents', () => {
      expect(output.length).to.eql(2);
    });

    it('should parse file contents', () => {
      expect(output).to.eql([
        {_id: 'doc1', title: 'foo'},
        {_id: 'doc2', title: 'bar'}
      ])
    });
  });
});
*/