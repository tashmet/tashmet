import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import Tashmet, {Collection} from '../../../packages/tashmet';
import Mingo from '../../../packages/mingo';
import Memory from '../../../packages/memory/dist';
import 'mingo/init/system';

chai.use(chaiAsPromised);

describe('validation', () => {
  let sales: Collection;

  before(async () => {
    const tashmet = await Tashmet
      .configure()
      .use(Mingo, {})
      .use(Memory, {})
      .connect();

    sales = tashmet.db('test').createCollection('sales', {
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
