import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import Tashmet, {Collection} from '../../../packages/tashmet/dist/index.js';
import mingo from '../../../packages/mingo/dist/index.js';
import Memory from '../../../packages/memory/dist/index.js';

chai.use(chaiAsPromised);

const { expect } = chai;

describe('query validation', () => {
  let sales: Collection;

  before(async () => {
    const store = Memory
      .configure({})
      .use(mingo())
      .bootstrap();

    const tashmet = await Tashmet.connect(store.proxy());

    sales = await tashmet.db('test').createCollection('sales', {
      validator: {
        item: {$type: 'string'}
      }
    });
  });

  it('should insert a valid document', async () => {
    const doc = await sales.insertOne({item : 'abc', price : 10,  quantity: 2});
    return expect(doc.acknowledged).to.eql(true);
  });

  it('should fail to insert an invalid document', () => {
    return expect(sales.insertOne({item : 3, price : 10,  quantity: 2}))
      .to.eventually.be.rejected;
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
              type: [ "number" ],
              description: "'gpa' must be a number if the field exists"
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
    return expect(result.acknowledged).to.eql(true);
  });

  it('should fail to insert an invalid document', () => {
    return expect(students.insertOne( {
      name: "Alice",
      year: 2016,
      major: "History",
      gpa: 3.0,
      address: {
        city: "NYC",
        street: "33rd Street"
      }
    })).to.eventually.be.rejected;
  });
});
