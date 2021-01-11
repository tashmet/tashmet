import {json} from '../../../src/serializers/json';
import {File} from '../../../src/channels/file';
import {Bundle} from '../../../src/sources/bundle';
import {expect} from 'chai';
import 'mocha';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import mockfs from 'mock-fs';
import * as fs from 'fs-extra';
import * as chokidar from 'chokidar';

chai.use(chaiAsPromised);
chai.use(sinonChai);

describe('File', () => {
  const serializer = json().create();
  const watcher = chokidar.watch([], {});
  const file = new Bundle(new File(serializer, 'collection.json', watcher));

  before(() => {
    mockfs({
      'collection.json': '{"doc1": {"foo": "bar"}, "doc2": {"foo": "bar"}}'
    });
  });

  after(() => {
    mockfs.restore();
  });

  describe('read', () => {
    it('should read documents from file system', async () => {
      const docs = await new Bundle(new File(serializer, 'collection.json')).read();

      expect(docs).to.eql({
        doc1: {foo: 'bar'},
        doc2: {foo: 'bar'}
      });
    });

    it('should get an empty list of documents from file that does not exist', async () => {
      const docs = await new Bundle(new File(serializer, 'noSuchFile.json')).read();

      return expect(docs).to.be.empty;
    });
  });

  describe('write', () => {
    it('should write a new collection to file', async () => {
      await new Bundle(new File(serializer, 'collection.json')).write([{_id: 'doc1'}]);

      return expect(fs.readFile('collection.json', 'utf-8')).to.eventually.eql(
        '{"doc1":{},"doc2":{"foo":"bar"}}');
    });
  });

  describe('events', () => {
    afterEach(() => {
      file.removeAllListeners();
    });

    describe('file added', () => {
      before(() => {
        mockfs({'collection.json': '{"doc1": {"foo": "bar"}}'});
      });

      it('should trigger document-updated event', (done) => {
        file.on('document-updated', (id: string, data: any) => {
          expect(id).to.eql('doc1');
          expect(data).to.eql({foo: 'bar'});
          done();
        });

        watcher.emit('add', 'collection.json');
      });
    });

    describe('file changed', () => {
      before(async () => {
        mockfs({'collection.json': '{"doc1": {}, "doc2": {}}'});
        await file.read();
      });

      it('should trigger document-updated event when a document has changed', (done) => {
        file.on('document-updated', (id: string, data: any) => {
          expect(id).to.eql('doc2');
          expect(data).to.eql({foo: 'new content'});
          done();
        });

        mockfs({'collection.json': '{"doc1": {}, "doc2": {"foo": "new content"}}'});
        watcher.emit('change', 'collection.json');
      });

      it('should trigger document-removed event when a document has been removed', (done) => {
        file.on('document-removed', (id: string) => {
          expect(id).to.eql('doc2');
          done();
        });

        mockfs({'collection.json': '{"doc1": {}}'});
        watcher.emit('change', 'collection.json');
      });
    });
  });
});
