import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import Tashmit from '../../../packages/tashmit'
import Memory from '../../../packages/database'
import operators from '../../../packages/operators/system';

chai.use(chaiAsPromised);

describe('validation', () => {
  let db = Tashmit
    .withConfiguration({operators})
    .bootstrap(Memory)
    .db('test');
  
  const sales = db.createCollection('sales', {
    validator: {
      item: {$type: 'string'}
    }
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
