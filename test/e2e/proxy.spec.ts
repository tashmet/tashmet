import 'mocha';
import Proxy from '../../packages/proxy/dist';
import TashmetServer from '../../packages/server/dist/index.js'
import mingo from '../../packages/mingo/dist/index.js'
import Memory from '../../packages/memory/dist/index.js'
import * as test from '../lib/index.js';

describe('proxy', () => {
  let server: TashmetServer;
  let proxy = new Proxy({ uri: 'http://localhost:8000' });
  
  before(() => {
    const store = Memory
      .configure({})
      .use(mingo())
      .bootstrap();

    server = new TashmetServer(store)
    server.listen(8000);
  });

  after(async () => {
    server.close();
  });

  test.collection(proxy);
  test.validation(proxy);
});
