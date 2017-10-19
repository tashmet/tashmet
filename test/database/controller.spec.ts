import {bootstrap, component, provider, Injector} from '@ziggurat/tiamat';
import {Isimud} from '../../src';
import {collection} from '../../src/database/decorators';
import {Collection, CollectionFactory, MemoryCollectionConfig, QueryOptions} from '../../src/interfaces';
import {Document} from '../../src/models/document';
import {Controller} from '../../src/database/controller';
import {EventEmitter} from 'eventemitter3';
import {find, findIndex} from 'lodash';
import {expect} from 'chai';
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

chai.use(chaiAsPromised);
chai.use(sinonChai);


class MockCollection extends EventEmitter implements Collection {
  public docs: Document[] = [];

  public constructor() {
    super();
  }

  public find(selector?: Object, options?: QueryOptions): Promise<any> {
    return Promise.resolve(this.docs);
  }

  public findOne(selector: Object): Promise<any> {
    let doc = find(this.docs, {_id: (<any>selector)._id});
    if (doc) {
      return Promise.resolve(doc);
    } else {
      return Promise.reject(new Error('Document not found'));
    }
  }

  public upsert(doc: any): Promise<any> {
    const i = findIndex(this.docs, function(o) { return o._id == doc._id; });
    if (i >= 0) {
      this.docs[i] = doc;
    } else {
      this.docs.push(doc);
    }
    this.emit('document-upserted', doc);
    return Promise.resolve(doc);
  }

  public remove(selector: any): Promise<void> {
    if (selector._id) {
      const i = findIndex(this.docs, function(o) { return o._id == selector._id; });
      if (i >= 0) {
        let doc = this.docs[i];
        this.docs.splice(i, 1);
        this.emit('document-removed', doc);
      }
    } else {
      this.docs = [];
    }
    return Promise.resolve();
  }

  public count(selector?: Object): Promise<number> {
    return Promise.resolve(this.docs.length);
  }

  public name(): string {
    return '';
  }
}

describe('Controller', () => {
  let cache  = new MockCollection();
  let buffer = new MockCollection();
  let source = new MockCollection();

  @provider({
    for: 'isimud.MemoryCollectionFactory',
    singleton: true
  })
  class MockCollectionFactory implements CollectionFactory<MemoryCollectionConfig> {
    public createCollection(name: string, config: MemoryCollectionConfig): Collection {
      if (name == 'test') {
        return cache;
      } else {
        return buffer;
      }
    }
  }

  @provider({
    for: 'test.Controller'
  })
  @collection({
    name: 'test'
  })
  class TestController extends Controller {}

  @component({
    dependencies: [Isimud],
    providers: [TestController, MockCollectionFactory],
    definitions: {
      'mushdamma.Models': [Document],
      'isimud.DatabaseConfig': {
        sources: {
          'test.Controller': (injector: Injector) => { return source; }
        }
      }
    }
  })
  class TestComponent {}

  let controller = bootstrap(TestComponent).get<Controller>('test.Controller');

  describe('findOne', () => {
    const stub = sinon.stub(source, 'findOne');

    before(() => {
      return controller.remove({});
    });

    afterEach(() => {
      stub.reset();
    });

    it('should fail if document does not exist in source', async () => {
      stub.returns(Promise.reject(new Error()));

      return expect(controller.findOne({_id: 'bar'})).to.eventually.be.rejected;
    });

    it('should read uncached document from source and cache it', async () => {
      stub.returns(Promise.resolve(new Document('foo')));

      let doc = await controller.findOne({_id: 'foo'});

      expect(doc).to.include({_id: 'foo', _revision: 1});
      expect(cache.count()).to.eventually.equal(1);
    });

    it('should read cached document from cache', async () => {
      let doc = await controller.findOne({_id: 'foo'});

      expect(doc).to.include({_id: 'foo', _revision: 1});
      expect(stub).to.not.have.been.called;
    });
  });

  describe('find', () => {
    let stub: any;

    before(() => {
      stub = sinon.stub(source, 'find');
      return controller.remove({});
    });

    afterEach(() => {
      stub.reset();
    });

    after(() => {
      stub.restore();
    });

    it('should read uncached documents from source', async () => {
      stub.returns([
        new Document('foo'),
        new Document('bar')
      ]);

      let docs = await controller.find();

      expect(docs).to.have.lengthOf(2);
    });

    it('should have added the documents to the cache', async () => {
      expect(await cache.count()).to.equal(2);
    });

    it('should read cached documents from cache', async () => {
      let docs = await controller.find();

      expect(docs).to.have.lengthOf(2);
      expect(stub).to.not.have.been.called;
    });
  });

  describe('upsert', () => {
    let stub: any;

    before(() => {
      stub = sinon.stub(source, 'upsert');
      return controller.remove({});
    });

    after(() => {
      stub.reset();
    });

    after(() => {
      stub.restore();
    });

    it('should add and return the document', async () => {
      let doc = await controller.upsert(new Document('foo'));

      expect(doc).to.include({_id: 'foo', _revision: 1});
    });

    it('should upsert the document to the cache', () => {
      return expect(cache.count()).to.eventually.equal(1);
    });

    it('should upsert the document to the source', () => {
      return expect(stub).to.have.been.calledOnce;
    });
  });

  describe('remove', () => {
    let stub: any;

    before(async () => {
      await controller.remove({});
      await controller.upsert(new Document('doc1'));
      await controller.upsert(new Document('doc2'));
      stub = sinon.stub(source, 'remove');
    });

    after(() => {
      stub.restore();
    });

    it('should remove a single document from the cache', async () => {
      await controller.remove({_id: 'doc1'});
      return expect(cache.count()).to.eventually.equal(1);
    });

    it('should remove the document from the source', () => {
      return expect(stub).to.have.been.calledOnce;
    });
  });

  describe('populate', () => {
    let stub: any;

    before(() => {
      stub = sinon.stub(source, 'find');
      return controller.remove({});
    });

    afterEach(() => {
      stub.reset();
    });

    after(() => {
      stub.restore();
    });

    it('should load all documents from source into cache', async () => {
      stub.returns(Promise.resolve([
        new Document('foo'),
        new Document('bar')
      ]));

      await controller.populate();
      return expect(cache.count()).to.eventually.equal(2);
    });

    it('should make all subsequent querries look only in the cache', async () => {
      let docs = await controller.find();

      expect(docs).to.have.lengthOf(2);
      expect(stub).to.not.have.been.called;
    })
  });

  describe('source upsert', () => {
    before(() => {
      return controller.remove({});
    });

    it('should trigger document-upserted in controller', (done) => {
      controller.on('document-upserted', (doc: Document) => {
        controller.removeAllListeners();
        done();
      });

      source.upsert(new Document('doc1'));
    });

    it('should upsert the document to the cache', () => {
      return expect(controller.cache.count()).to.eventually.equal(1);
    });
  });

  describe('source remove', () => {
    before(async () => {
      await controller.remove({});
      await source.upsert(new Document('doc1'));
    });

    it('should trigger document-removed in controller', (done) => {
      controller.on('document-removed', (doc: Document) => {
        controller.removeAllListeners();
        done();
      });

      source.remove({_id: 'doc1'});
    });

    it('should remove the document from the cache', () => {
      return expect(cache.count()).to.eventually.equal(0);
    });
  });
});
