import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import {ajv} from '../packages/ajv/dist';
import {
  bootstrap,
  component,
  Provider,
  Collection,
  Database,
  DatabaseConfig,
  memory,
} from '../packages/ziqquratu/dist';

chai.use(chaiAsPromised);

const schema = {
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

describe('ajv', () => {
  @component({
    providers: [
      Provider.ofInstance<DatabaseConfig>('ziqquratu.DatabaseConfig', {
        collections: {
          'schemas': memory([schema]),
          'products': {
            source: memory(),
            use: [
              ajv({
                collection: 'schemas',
                schema: 'http://example.com/product.schema.json'
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
    collection = app.database.collection('products');
  });

  beforeEach(async () => {
    await collection.deleteMany({});
  });

  describe('insertOne', () => {
    it('should fail if document is missing productId', () => {
      return expect(collection.insertOne({}))
        .to.eventually.be.rejectedWith("should have required property 'productId'");
    });
    it('should fail if productId is not a number', () => {
      return expect(collection.insertOne({productId: 'foo'}))
        .to.eventually.be.rejectedWith("should be integer");
    });
    it('should fail if document is missing productName', () => {
      return expect(collection.insertOne({productId: 1}))
        .to.eventually.be.rejectedWith("should have required property 'productName'");
    });
    it('should insert the document if validation passed', async () => {
      const res = await collection.insertOne({productId: 1, productName: 'foo'});
      expect(res.productName).to.eql('foo');
      const doc = await collection.findOne({productId: 1});
      expect(doc.productName).to.eql('foo');
    });
  });

  describe('replaceOne', () => {
    beforeEach(async () => {
      await collection.insertOne({productId: 1, productName: 'foo'});
    });

    it('should fail if new document does not validate', async () => {
      return expect(collection.replaceOne({productId: 1}, {productId: 1, productName: 2}))
        .to.eventually.be.rejectedWith("should be string");
    });
    it('should replace document if validation passed', async () => {
      const res = await collection.replaceOne({productId: 1}, {productId: 1, productName: 'bar'});
      expect(res.productName).to.eql('bar');
      const doc = await collection.findOne({productId: 1});
      expect(doc.productName).to.eql('bar');
    });
  });
});
