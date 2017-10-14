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
    findOne: 0
  }

  public constructor() {
    super();
  }

  public find(selector?: Object, options?: QueryOptions): Promise<any> {
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
    if (i > 0) {
      this.docs[i] = doc;
    } else {
      this.docs.push(doc);
    }
    this.emit('document-upserted', doc);
    return Promise.resolve(doc);
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

  describe('upserting in source', () => {
    it('should trigger event in controller', (done) => {
      controller.on('document-upserted', doc => {
        expect(doc).to.include({_id: 'foo', _revision: 1});
        done();
      });

      controller.populate().then(() => {
        source.upsert(new Document('foo'));
      });
    });

    it('should store the document in cache of controller', () => {
      expect(controller.cache.count()).to.eventually.equal(1);
    });
  });

  describe('findOne', () => {
    it('should fail if document does not exist in source', () => {
      expect(controller.findOne({_id: 'bar'})).to.eventually.be.rejected;
    });

    it('should read existing document from cache', () => {
      source.callCount['findOne'] = 0;
      return controller.findOne({_id: 'foo'}).then((doc: Document) => {
        expect(doc).to.include({_id: 'foo', _revision: 1});
        expect(source.callCount['findOne']).to.equal(0);
      });
    });
  });
});
