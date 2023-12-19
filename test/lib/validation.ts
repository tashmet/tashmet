import 'mocha';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import Tashmet, { Collection, TashmetServerError, TashmetProxy } from '@tashmet/tashmet';

chai.use(chaiAsPromised);
chai.use(sinonChai);

const { expect } = chai;

export function validation(proxy: TashmetProxy) {
  describe('query validation', () => {
    describe('$type', () => {
      let sales: Collection;

      before(async () => {
        const tashmet = await Tashmet.connect(proxy);

        sales = await tashmet.db('test').createCollection('sales', {
          validator: {
            item: { $type: 'string' }
          }
        });
      });

      after(async () => {
        await sales.drop();
      });

      it('should insert a valid document', async () => {
        const doc = await sales.insertOne({item : 'abc', price : 10,  quantity: 2});
        return expect(doc.acknowledged).to.eql(true);
      });

      it('should fail to insert an invalid document', () => {
        return expect(sales.insertOne({item : 3, price : 10,  quantity: 2}))
          .to.eventually.be.rejectedWith(TashmetServerError, 'Document failed validation')
          .that.has.property('errInfo')
          .that.has.property('details')
          .that.eql({
            operatorName: '$type',
            specifiedAs: 'string',
            reason: 'type did not match',
            consideredValue: 3,
            consideredType: 'Number',
          });
      });
    });

    describe('$expr', () => {
      let orders: Collection;

      before(async () => {
        const tashmet = await Tashmet.connect(proxy);

        orders = await tashmet.db('test').createCollection('sales', {
          validator: {
            $expr: {
              $eq: [
                "$totalWithVAT",
                { $multiply: [ "$total", { $sum: [ 1, "$VAT" ] } ] }
              ]
            }
          }
        });
      });

      after(async () => {
        await orders.drop();
      });

      it('should insert a valid document', async () => {
        const doc = await orders.insertOne({
          total: 141,
          VAT: 0.20,
          totalWithVAT: 169.2
        });
        return expect(doc.acknowledged).to.eql(true);
      });

      it('should fail to insert an invalid document', () => {
        return expect(orders.insertOne({
          total: 141,
          VAT: 0.20,
          totalWithVAT: 169
        }))
          .to.eventually.be.rejectedWith(TashmetServerError, 'Document failed validation')
          .that.has.property('errInfo')
          .that.has.property('details')
          .that.eql({
            operatorName: '$expr',
            specifiedAs: {
              '$expr': {
                '$eq': [
                  '$totalWithVAT',
                  {
                    '$multiply': [ '$total', { '$sum': [ 1, '$VAT' ] } ]
                  }
                ]
              }
            },
            reason: 'expression did not match',
            expressionResult: false
          });
      });
    });
  });

  describe('json schema validation', () => {
    let students: Collection;

    before(async () => {
      const tashmet = await Tashmet.connect(proxy);

      students = await tashmet.db('test').createCollection('students', {
        validator: {
          $jsonSchema: {
            type: "object",
            title: "Student Object Validation",
            required: [ "address", "major", "name", "year" ],
            properties: {
              name: {
                type: "string",
                description: "'name' must be a string and is required"
              },
              year: {
                type: "number",
                minimum: 2017,
                maximum: 3017,
                description: "'year' must be an number in [ 2017, 3017 ] and is required"
              },
              gpa: {
                type: "number",
                description: "'gpa' must be a number if the field exists"
              },
              address: {
                type: "object",
                properties: {
                  city: {
                    type: "string",
                    description: "'city' must be a string"
                  },
                  street: {
                    type: "string",
                    description: "'street' must be a string"
                  }
                }
              }
            }
          }
        }
      });
    });

    after(async () => {
      await students.drop();
    });

    it('should insert a valid document', async () => {
      const result = await students.insertOne( {
        name: "Alice",
        year: 2019,
        major: "History",
        gpa: 3.0,
        address: {
          city: "NYC",
          street: "33rd Street"
        }
      });
      expect(result.acknowledged).to.eql(true);
    });

    it('should fail to insert a document with missing required properties', () => {
      return expect(students.insertOne( {
        name: "Alice",
        year: 2017,
        gpa: 3.0,
      }))
        .to.eventually.be.rejectedWith(TashmetServerError, 'Document failed validation')
        .that.has.property('errInfo')
        .that.has.property('details')
        .that.eql({
          operatorName: '$jsonSchema',
          title: 'Student Object Validation',
          schemaRulesNotSatisfied: [
            {
              operatorName: 'required',
              specifiedAs: { required: [ 'address', 'major', 'name', 'year' ] },
              missingProperties: [ 'address', 'major' ]
            }
          ]
        });
    });

    it('should fail to insert a document with single failing property', () => {
      return expect(students.insertOne( {
        name: "Alice",
        year: 2016,
        major: "History",
        gpa: 3.0,
        address: {
          city: "NYC",
          street: "33rd Street"
        }
      }))
        .to.eventually.be.rejectedWith(TashmetServerError, 'Document failed validation')
        .that.has.property('errInfo')
        .that.has.property('details')
        .that.eql({
          operatorName: '$jsonSchema',
          title: 'Student Object Validation',
          schemaRulesNotSatisfied: [
            {
              operatorName: 'properties',
              propertiesNotSatisfied: [
                {
                  propertyName: 'year',
                  description: "'year' must be an number in [ 2017, 3017 ] and is required",
                  details: [
                    {
                      operatorName: 'minimum',
                      specifiedAs: { minimum: 2017 },
                      reason: 'comparison failed',
                      consideredValue: 2016
                    }
                  ]
                }
              ]
            }
          ]
        });
    });

    it('should fail to insert a document with multiple failing properties', () => {
      return expect(students.insertOne( {
        name: "Alice",
        year: 4000,
        major: "History",
        gpa: '3.0',
        address: {
          city: "NYC",
          street: "33rd Street"
        }
      }))
        .to.eventually.be.rejectedWith(TashmetServerError, 'Document failed validation')
        .that.has.property('errInfo')
        .that.has.property('details')
        .that.eql({
          operatorName: '$jsonSchema',
          title: 'Student Object Validation',
          schemaRulesNotSatisfied: [
            {
              operatorName: 'properties',
              propertiesNotSatisfied: [
                {
                  propertyName: 'year',
                  description: "'year' must be an number in [ 2017, 3017 ] and is required",
                  details: [
                    {
                      operatorName: 'maximum',
                      specifiedAs: { maximum: 3017 },
                      reason: 'comparison failed',
                      consideredValue: 4000
                    }
                  ]
                },
                {
                  propertyName: 'gpa',
                  description: "'gpa' must be a number if the field exists",
                  details: [
                    {
                      operatorName: 'type',
                      specifiedAs: { type: 'number' },
                      reason: 'type did not match',
                      consideredValue: '3.0',
                      consideredType: 'string'
                    }
                  ]
                }
              ]
            }
          ]
        });
    });

    it('should fail to insert a document with single nested failing property', () => {
      return expect(students.insertOne( {
        name: "Alice",
        year: 2017,
        major: "History",
        gpa: 3.0,
        address: {
          city: "NYC",
          street: 33,
        }
      }))
        .to.eventually.be.rejectedWith(TashmetServerError, 'Document failed validation')
        .that.has.property('errInfo')
        .that.has.property('details')
        .that.eql({
          operatorName: '$jsonSchema',
          title: 'Student Object Validation',
          schemaRulesNotSatisfied: [
            {
              operatorName: 'properties',
              propertiesNotSatisfied: [
                {
                  propertyName: 'address',
                  details: [
                    {
                      operatorName: 'properties',
                      propertiesNotSatisfied: [
                        {
                          propertyName: 'street',
                          description: "'street' must be a string",
                          details: [
                            {
                              operatorName: 'type',
                              specifiedAs: { type: 'string' },
                              reason: 'type did not match',
                              consideredValue: 33,
                              consideredType: 'number'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        });
    });

    it('should bypass validation on invalid document', async () => {
      const result = await students.insertOne({
        name: "Alice",
        year: 2016,
        major: "History",
        gpa: 3.0,
        address: {
          city: "NYC",
          street: "33rd Street"
        }
      }, { bypassDocumentValidation: true });
      expect(result.acknowledged).to.eql(true);
    });
  });

  describe('json schema validation on strings', () => {
    let users: Collection;

    before(async () => {
      const tashmet = await Tashmet.connect(proxy);

      users = await tashmet.db('test').createCollection('students', {
        validator: {
          $jsonSchema: {
            type: "object",
            title: "User object validation",
            properties: {
              name: {
                type: "string",
                description: "'name' must be a string",
                minLength: 5,
                maxLength: 10
              },
            }
          }
        }
      });
    });

    after(async () => {
      await users.drop();
    });

    it('should fail insert a document with too short name', () => {
      return expect(users.insertOne({
        name: "Foo"
      }))
        .to.eventually.be.rejectedWith(TashmetServerError, 'Document failed validation')
        .that.has.property('errInfo')
        .that.has.property('details')
        .that.eql({
          operatorName: '$jsonSchema',
          title: 'User object validation',
          schemaRulesNotSatisfied: [
            {
              operatorName: 'properties',
              propertiesNotSatisfied: [
                {
                  propertyName: 'name',
                  description: "'name' must be a string",
                  details: [
                    {
                      operatorName: 'minLength',
                      specifiedAs: { minLength: 5 },
                      reason: 'specified string length was not satisfied',
                      consideredValue: 'Foo'
                    }
                  ]
                }
              ]
            }
          ]
        });
    });

    it('should fail insert a document with too long name', () => {
      return expect(users.insertOne({
        name: "A too long name"
      }))
        .to.eventually.be.rejectedWith(TashmetServerError, 'Document failed validation')
        .that.has.property('errInfo')
        .that.has.property('details')
        .that.eql({
          operatorName: '$jsonSchema',
          title: 'User object validation',
          schemaRulesNotSatisfied: [
            {
              operatorName: 'properties',
              propertiesNotSatisfied: [
                {
                  propertyName: 'name',
                  description: "'name' must be a string",
                  details: [
                    {
                      operatorName: 'maxLength',
                      specifiedAs: { maxLength: 10 },
                      reason: 'specified string length was not satisfied',
                      consideredValue: 'A too long name'
                    }
                  ]
                }
              ]
            }
          ]
        });
    });
  });

  describe('json schema validation on array', () => {
    let posts: Collection;

    before(async () => {
      const tashmet = await Tashmet.connect(proxy);

      posts = await tashmet.db('test').createCollection('posts', {
        validator: {
          $jsonSchema: {
            type: "object",
            title: "Array validation",
            properties: {
              tags: {
                type: "array",
                description: "tags must be array of strings with at least one item",
                items: {
                  type: "string"
                },
                minItems: 1,
                uniqueItems: true
              },
            }
          }
        }
      });
    });

    it('should insert a valid document', async () => {
      const result = await posts.insertOne( {
        tags: ['tag1']
      });
      expect(result.acknowledged).to.eql(true);
    });

    it('should fail to insert a document with less than minItems', () => {
      return expect(posts.insertOne({ tags: [] }))
        .to.eventually.be.rejectedWith(TashmetServerError, 'Document failed validation')
        .that.has.property('errInfo')
        .that.has.property('details')
        .that.eql({
          operatorName: '$jsonSchema',
          title: 'Array validation',
          schemaRulesNotSatisfied: [
            {
              operatorName: 'properties',
              propertiesNotSatisfied: [
                {
                  propertyName: 'tags',
                  description: 'tags must be array of strings with at least one item',
                  details: [
                    {
                      operatorName: 'minItems',
                      specifiedAs: { minItems: 1 },
                      reason: 'array did not match specified length',
                      consideredValue: [],
                      numberOfItems: 0
                    }
                  ]
                }
              ]
            }
          ]
        });
    });

    it('should fail to insert a document with wrong item type', () => {
      return expect(posts.insertOne({ tags: [2] }))
        .to.eventually.be.rejectedWith(TashmetServerError, 'Document failed validation')
        .that.has.property('errInfo')
        .that.has.property('details')
        .that.eql({
          operatorName: '$jsonSchema',
          title: 'Array validation',
          schemaRulesNotSatisfied: [
            {
              operatorName: 'properties',
              propertiesNotSatisfied: [
                {
                  propertyName: 'tags',
                  description: 'tags must be array of strings with at least one item',
                  details: [
                    {
                      operatorName: 'items',
                      reason: 'At least one item did not match the sub-schema',
                      itemIndex: 0,
                      details: [
                        {
                          operatorName: 'type',
                          specifiedAs: { type: 'string' },
                          reason: 'type did not match',
                          consideredValue: 2,
                          consideredType: 'number'
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        });
    });

    it('should fail to insert a document with non-array type', () => {
      return expect(posts.insertOne({ tags: 'tag1' }))
        .to.eventually.be.rejectedWith(TashmetServerError, 'Document failed validation')
        .that.has.property('errInfo')
        .that.has.property('details')
        .that.eql({
          operatorName: '$jsonSchema',
          title: 'Array validation',
          schemaRulesNotSatisfied: [
            {
              operatorName: 'properties',
              propertiesNotSatisfied: [
                {
                  propertyName: 'tags',
                  description: 'tags must be array of strings with at least one item',
                  details: [
                    {
                      consideredType: "string",
                      consideredValue: "tag1",
                      operatorName: "type",
                      reason: "type did not match",
                      specifiedAs: {
                        type: "array"
                      }
                    }
                  ]
                }
              ]
            }
          ]
      });
    });

    it('should fail to insert a document when items are not unique', () => {
      return expect(posts.insertOne({ tags: ['tag1', 'tag1'] }))
        .to.eventually.be.rejectedWith(TashmetServerError, 'Document failed validation')
        .that.has.property('errInfo')
        .that.has.property('details')
        .that.eql({
          operatorName: '$jsonSchema',
          title: 'Array validation',
          schemaRulesNotSatisfied: [
            {
              operatorName: 'properties',
              propertiesNotSatisfied: [
                {
                  propertyName: 'tags',
                  description: 'tags must be array of strings with at least one item',
                  details: [
                    {
                      operatorName: "uniqueItems",
                      specifiedAs: {
                        uniqueItems: true
                      },
                      reason: "found a duplicate item",
                      consideredValue: ["tag1", "tag1"],
                      duplicateValue: "tag1",
                    }
                  ]
                }
              ]
            }
          ]
      });
    });
  });

  describe('query for valid documents', () => {
    let inventory: Collection;

    const myschema = {
      $jsonSchema: {
        type: "object",
        required: [ "item", "qty", "instock" ],
        properties: {
          item: { type: "string" },
          qty: { type: "integer" },
          size: {
            type: "object",
            required: [ "uom" ],
            properties: {
              uom: { type: "string" },
              h: { type: "number" },
              w: { type: "number" }
            }
          },
          instock: { type: "boolean" }
        }
      }
    }

    before(async () => {
      const tashmet = await Tashmet.connect(proxy);

      inventory = await tashmet.db('test').createCollection('inventory');

      await inventory.insertMany([
        { item: "journal", qty: 25, size: { h: 14, w: 21, uom: "cm" } },
        { item: "notebook", qty: 50, size: { h: 8.5, w: 11, uom: "in" } },
        { item: "paper", qty: 100, size: { h: 8.5, w: '11', uom: "in" }, instock: 1 },
        { item: "planner", qty: 75, size: { h: 22.85, w: '30', uom: "cm" }, instock: 1 },
        { item: "postcard", qty: 45, size: { h: '10', w: 15.25, uom: "cm" }, instock: true },
        { item: "apple", qty: 45, status: "A", instock: true },
        { item: "pears", qty: 50, status: "A", instock: true }
      ]);
    });

    after(async () => {
      await inventory.drop();
    });

    it('should return valid documents using find', async () => {
      const result = await inventory.find(myschema, { sort: {'item': 1} }).toArray();

      expect(result.map(doc => doc.item))
        .to.have.eql(['apple', 'pears']);
    });

    it('should return valid documents using aggregation', async () => {
      const result = await inventory.aggregate([{ $match: myschema }, { $sort: { item: 1 }}]).toArray();

      expect(result.map(doc => doc.item))
        .to.eql(['apple', 'pears']);
    });

    it('should return invalid documents using find', async () => {
      const result = await inventory.find({ $nor: [ myschema ] }, { sort: { item: 1 } }).toArray();

      expect(result.map(doc => doc.item))
        .to.eql(['journal', 'notebook', 'paper', 'planner', 'postcard']);
    });

    it('should return invalid documents using aggregation', async () => {
      const result = await inventory.aggregate([{ $match: { $nor: [ myschema ] } }, { $sort: { item: 1 } }]).toArray();

      expect(result.map(doc => doc.item))
        .to.eql(['journal', 'notebook', 'paper', 'planner', 'postcard']);
    });

    it('should update documents that dont match schema', async () => {
      await inventory.updateMany(
        {
            $nor: [ myschema ]
        },
        {
            $set: { isValid: false }
        }
      );
      const result = await inventory.find({ isValid: false }, { sort: { item: 1 } }).toArray();

      expect(result.map(doc => doc.item))
        .to.eql(['journal', 'notebook', 'paper', 'planner', 'postcard']);
    });

    it('should delete documents that dont match schema', async () => {
      await inventory.deleteMany( { $nor: [ myschema ] } );
      const docs = await inventory.find().sort('item', 1).toArray();

      expect(docs.map(doc => doc.item)).to.eql(['apple', 'pears']);
    });
  });
}
