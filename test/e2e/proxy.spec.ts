import 'mocha';

import Tashmet from '../../packages/tashmet/dist'
import Proxy from '../../packages/proxy/dist';
import TashmetServer from '../../packages/server/dist/index.js'
import mingo from '../../packages/mingo/dist/index.js'
import Memory from '../../packages/memory/dist/index.js'
import { collectionTests } from '../integration/collection';


describe('proxy', () => {
  let server: TashmetServer;

  async function makeCollection() {
    const store = Memory
      .configure({})
      .use(mingo())
      .bootstrap()

    server = new TashmetServer(store)
    server.listen(8000);

    const tashmet = await Tashmet.connect(new Proxy({ uri: 'http://localhost:8000' }));

    return tashmet
      .db('testdb')
      .createCollection('test');
  }

  after(async () => {
    server.close();
  });

  collectionTests(makeCollection);
});
