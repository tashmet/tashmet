import {bootstrap, component, Injector} from '@ziggurat/tiamat';
import {IsimudLoki} from '@ziggurat/isimud-loki';
import {Isimud} from '../../src';
import {Collection, CollectionFactory, MemoryCollectionConfig, QueryOptions} from '../../src/interfaces';
import {Document} from '../../src/models/document';
import {EventEmitter} from 'eventemitter3';
import {find} from 'lodash';
import {expect} from 'chai';
import 'mocha';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

class MockSource extends EventEmitter implements Collection {
  public constructor(public docs: Document[]) {
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
      return Promise.reject(new Error());
    }
  }

  public upsert(doc: any): Promise<any> {
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
  // @collection()

  @component({
    dependencies: [Isimud, IsimudLoki]
  })
  class TestComponent {}

  let collectionFactory = bootstrap(TestComponent).get<CollectionFactory<MemoryCollectionConfig>>(
    'isimud.MemoryCollectionFactory'
  );
  let cache = collectionFactory.createCollection('testCache', {});
  let adapter = new MockPersistenceAdapter([
    <Document>{_id: 'doc1'},
    <Document>{_id: 'doc2'}
  ]);
  let collection = new PersistenceCollection(adapter, cache);

  it('should find all documents', () => {
    return collection.find().then((docs: Document[]) => {
      expect(docs).to.have.lengthOf(2);
      expect(docs[0]).to.have.property('_id', 'doc1');
      expect(docs[1]).to.have.property('_id', 'doc2');
    });
  });

  it('should filter with selector', () => {
    return collection.find({_id: 'doc2'}).then((docs: Document[]) => {
      expect(docs).to.have.lengthOf(1);
      expect(docs[0]).to.have.property('_id', 'doc2');
    });
  });
});
*/