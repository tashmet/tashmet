import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import Tashmet, { Collection, TashmetServerError } from '../../../packages/tashmet/dist/index.js';
import mingo from '../../../packages/mingo/dist/index.js';
import Memory from '../../../packages/memory/dist/index.js';

chai.use(chaiAsPromised);

const { expect } = chai;

describe('query validation', () => {
  describe('$type', () => {
    let sales: Collection;

    before(async () => {
      const store = Memory
        .configure({})
        .use(mingo())
        .bootstrap();

      const tashmet = await Tashmet.connect(store.proxy());

      sales = await tashmet.db('test').createCollection('sales', {
        validator: {
          item: { $type: 'string' }
        }
      });
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
      const store = Memory
        .configure({})
        .use(mingo())
        .bootstrap();

      const tashmet = await Tashmet.connect(store.proxy());

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
    const store = Memory
      .configure({})
      .use(mingo())
      .bootstrap();

    const tashmet = await Tashmet.connect(store.proxy());

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

describe('query for valid documents', () => {
  let inventory: Collection;

  const myschema = {
    $jsonSchema: {
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
    const store = Memory
      .configure({})
      .use(mingo())
      .bootstrap();

    const tashmet = await Tashmet.connect(store.proxy());

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

  it('should return valid documents using find', async () => {
    const result = await inventory.find(myschema).toArray();

    expect(result.map(doc => doc.item))
      .to.eql(['apple', 'pears']);
  });

  it('should return valid documents using aggregation', async () => {
    const result = await inventory.aggregate([{ $match: myschema }]).toArray();

    expect(result.map(doc => doc.item))
      .to.eql(['apple', 'pears']);
  });

  it('should return invalid documents using find', async () => {
    const result = await inventory.find({ $nor: [ myschema ] }).toArray();

    expect(result.map(doc => doc.item))
      .to.eql(['journal', 'notebook', 'paper', 'planner', 'postcard']);
  });

  it('should return invalid documents using aggregation', async () => {
    const result = await inventory.aggregate([{ $match: { $nor: [ myschema ] } }]).toArray();

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
    const result = await inventory.find({ isValid: false }).toArray();

    expect(result.map(doc => doc.item))
      .to.eql(['journal', 'notebook', 'paper', 'planner', 'postcard']);
  });

  it('should delete documents that dont match schema', async () => {
    await inventory.deleteMany( { $nor: [ myschema ] } );
    const docs = await inventory.find().toArray();

    expect(docs.map(doc => doc.item)).to.eql(['apple', 'pears']);
  });
});
