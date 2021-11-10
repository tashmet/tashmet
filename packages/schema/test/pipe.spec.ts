import {memory, Collection} from '@tashmit/database';
import {DatabaseService} from '@tashmit/database/dist/database';
import {DefaultLogger} from '@tashmit/core/dist/logging/logger';
import {BasicContainer} from '@tashmit/core';
import {validation, ValidationPipeStrategy} from '../src/pipe';
import 'mocha';
import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

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

describe('validation', () => {
  const database = new DatabaseService(new DefaultLogger(), new BasicContainer());

  before(async () => {
    await database.createCollection('schemas', memory({documents: [schemaDoc]}))
  })

  describe('Error', () => {
    let col: Collection;

    before(async () => {
      col = await database.createCollection('strategy.Error', {
        source: memory(),
        // use: [validation({ schema: 'http://example.com/product.schema.json', strategy: ValidationPipeStrategy.ErrorInFilterOut })]
      });

    });

    it('should do something', async () => {
      expect(col.insertOne({foo: 'bar'})).to.eventually.throw;
    });
  });
});
