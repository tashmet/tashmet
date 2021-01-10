import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import Schema, {validation, ValidationPipeStrategy} from '../../packages/schema/dist';
import {
  bootstrap,
  component,
  Provider,
  Collection,
  Database,
  DatabaseConfig,
  memory,
} from '../../packages/ziqquratu/dist';

chai.use(chaiAsPromised);

const schemaDoc = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'http://example.com/product.schema.json',
  title: 'Product',
  description: "A product from Acme's catalog",
  type: 'object',
  properties: {
    productId: {
      description: 'The unique identifier for a product',
      type: 'integer'
    },
    productName: {
      description: 'Name of the product',
      type: 'string'
    }
  },
  required: ['productId', 'productName']
};

describe('schema', () => {
  @component({
    dependencies: [Schema],
    providers: [
      Provider.ofInstance<DatabaseConfig>('ziqquratu.DatabaseConfig', {
        collections: {
          'schemas': memory({documents: [schemaDoc]}),
          'products': {
            source: memory({documents: [
              {_id: 1, type: 'product', productId: 10, productName: 'Valid product'},
              {_id: 2, type: 'product', productName: 'Invalid product'},
            ]}),
            use: [
              validation({
                schema: {
                  'http://example.com/product.schema.json': {type: 'product'}
                },
                strategy: ValidationPipeStrategy.ErrorInFilterOut,
              })
            ],
          }
        },
      })
    ],
    inject: ['ziqquratu.Database']
  })
  class TestComponent {
    public constructor(public database: Database) {}
  }

  let collection: Collection;

  before(async () => {
    const app = (await bootstrap(TestComponent));
    collection = await app.database.collection('products');
  });

  describe('outgoing', () => {
    afterEach(() => {
      collection.removeAllListeners();
    });

    describe('findOne', () => {
      it('should return valid document', async () => {
        return expect(collection.findOne({_id: 1}))
          .to.eventually.eql({_id: 1, type: 'product', productId: 10, productName: 'Valid product'});
      });
      it('should not return invalid document', async () => {
        return expect(collection.findOne({_id: 2}))
          .to.eventually.eql(null);
      });
      it('should emit event for invalid document', (done) => {
        collection.on('document-error', err => {
          expect(err.message).to.eql(
            "validation of '2' failed: should have required property 'productId'"
          );
          done();
        });
        collection.findOne({_id: 2});
      });
    });

    describe('find', () => {
      it('should return only valid documents', async () => {
        return expect(collection.find().toArray())
          .to.eventually.eql([{_id: 1, type: 'product', productId: 10, productName: 'Valid product'}]);
      });
      it('should emit event for invalid document', (done) => {
        collection.on('document-error', err => {
          expect(err.message).to.eql(
            "validation of '2' failed: should have required property 'productId'"
          );
          done();
        });
        collection.find().toArray();
      });
    });
  });

  describe('incoming', () => {
    beforeEach(async () => {
      await collection.deleteMany({});
    });

    describe('insertOne', () => {
      it('should fail if no schema is defined', () => {
        return expect(collection.insertOne({_id: 1, type: 'unknown'})).to.eventually.be.rejectedWith(
          "No schema defined for document with ID: '1'"
        );
      });
      it('should fail if document is missing productId', () => {
        return expect(collection.insertOne({type: 'product'})).to.eventually.be.rejectedWith(
          "validation failed: should have required property 'productId'"
        );
      });
      it('should fail if productId is not a number', () => {
        return expect(collection.insertOne({type: 'product', productId: 'foo'})).to.eventually.be.rejectedWith(
          "validation failed: '.productId' should be integer"
        );
      });
      it('should fail if document is missing productName', () => {
        return expect(collection.insertOne({type: 'product', productId: 1})).to.eventually.be.rejectedWith(
          "validation failed: should have required property 'productName'"
        );
      });
      it('should insert the document if validation passed', async () => {
        const res = await collection.insertOne({type: 'product', productId: 1, productName: 'foo'});
        expect(res.productName).to.eql('foo');
        const doc = await collection.findOne({productId: 1});
        expect(doc.productName).to.eql('foo');
      });
    });

    describe('replaceOne', () => {
      beforeEach(async () => {
        await collection.insertOne({_id: 1, type: 'product', productId: 1, productName: 'foo'});
      });

      it('should fail if new document does not validate', async () => {
        return expect(collection.replaceOne({productId: 1}, {type: 'product', productId: 1, productName: 2}))
          .to.eventually.be.rejectedWith("validation failed: '.productName' should be string");
      });
      it('should replace document if validation passed', async () => {
        const res = await collection.replaceOne({productId: 1}, {type: 'product', productId: 1, productName: 'bar'});
        expect(res.productName).to.eql('bar');
        const doc = await collection.findOne({productId: 1});
        expect(doc.productName).to.eql('bar');
      });
    });
  });
});
