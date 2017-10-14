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

chai.use(chaiAsPromised);

@provider({
  for: 'isimud.MemoryCollectionFactory',
  singleton: true
})
export class MockCollectionFactory implements CollectionFactory<MemoryCollectionConfig> {
  public createCollection(name: string, config: MemoryCollectionConfig): Collection {
    return new MockCollection();
  }
}

class MockCollection extends EventEmitter implements Collection {
  public docs: Document[] = [];
  public callCount = {
    find: 0,
    findOne: 0
  }

  public constructor() {
    super();
  }

  public find(selector?: Object, options?: QueryOptions): Promise<any> {
    this.callCount['find'] += 1;
    return Promise.resolve(this.docs);
  }

  public findOne(selector: Object): Promise<any> {
    this.callCount['findOne'] += 1;
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
        this.docs.splice(i, 1);
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
  let source = new MockCollection();

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

  it('should initially have no documents', () => {
    return controller.find().then((docs: Document[]) => {
      expect(docs).to.have.lengthOf(0);
    });
  });

  describe('findOne', () => {
    before(() => {
      return controller.remove({});
    });

    it('should fail if document does not exist in source', () => {
      return expect(controller.findOne({_id: 'bar'})).to.eventually.be.rejected;
    });

    it('should read uncached document from source and cache it', () => {
      source.callCount['findOne'] = 0;
      source.docs.push(new Document('foo'));
      return controller.findOne({_id: 'foo'}).then((doc: Document) => {
        expect(doc).to.include({_id: 'foo', _revision: 1});
        expect(source.callCount['findOne']).to.equal(1);
        expect(controller.cache.count()).to.eventually.equal(1);
      });
    });

    it('should read cached document from cache', () => {
      source.callCount['findOne'] = 0;
      return controller.findOne({_id: 'foo'}).then((doc: Document) => {
        expect(doc).to.include({_id: 'foo', _revision: 1});
        expect(source.callCount['findOne']).to.equal(0);
      });
    });
  });

  describe('find', () => {
    before(() => {
      return controller.remove({});
    });

    it('should read uncached documents from source and cache them', () => {
      source.callCount['find'] = 0;
      source.docs.push(new Document('foo'));
      source.docs.push(new Document('bar'));
      return controller.find().then((docs: Document[]) => {
        expect(docs).to.have.lengthOf(2);
        expect(source.callCount['find']).to.equal(1);
        expect(controller.cache.count()).to.eventually.equal(2);
      });
    });

    it('should read cached documents from cache', () => {
      source.callCount['find'] = 0;
      return controller.find().then((docs: Document[]) => {
        expect(docs).to.have.lengthOf(2);
        expect(source.callCount['find']).to.equal(0);
      });
    });
  });

  describe('upsert', () => {
    before(() => {
      return controller.remove({});
    });

    it('should add and return the document', () => {
      return controller.upsert(new Document('foo')).then((doc: Document) => {
        expect(doc).to.include({_id: 'foo', _revision: 1});
      });
    });

    it('should upsert the document to the cache', () => {
      return expect(controller.cache.count()).to.eventually.equal(1);
    });

    it('should upsert the document to the source', () => {
      return expect(controller.source.count()).to.eventually.equal(1);
    });
  });
  
  describe('remove', () => {
    before(() => {
      return controller.remove({}).then(() => {
        controller.upsert(new Document('doc1'));
        controller.upsert(new Document('doc2'));
      });
    });

    it('should remove a single document', () => {
      return controller.remove({_id: 'doc1'}).then(() => {
        return expect(controller.count()).to.eventually.equal(1);
      });
    });

    it('should remove the document from the source', () => {
      return expect(controller.source.count()).to.eventually.equal(1);
    });
  });

  describe('populate', () => {
    before(() => {
      return controller.remove({});
    });

    it('should load all documents from source', () => {
      source.docs.push(new Document('foo'));
      source.docs.push(new Document('bar'));

      return controller.populate().then(() => {
        return expect(controller.count()).to.eventually.equal(2);
      });
    });
  });
});
