import Tashmet from '../../../packages/tashmet/dist/index.js';
import mingo from '../../../packages/mingo/dist/index.js';
import Memory from '../../../packages/memory/dist/index.js';
import 'mingo/init/system';
import 'mocha';
import { collectionTests } from '../collection.js';


describe('Collection', () => {
  async function makeCollection() {
    const store = Memory
      .configure({})
      .use(mingo())
      .bootstrap();

    const tashmet = await Tashmet.connect(store.proxy());
    return tashmet.db('testdb').createCollection('test');
  }

  collectionTests(makeCollection);
});
