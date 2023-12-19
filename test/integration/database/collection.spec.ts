import mingo from '../../../packages/mingo/dist/index.js';
import Memory from '../../../packages/memory/dist/index.js';
import 'mingo/init/system';
import 'mocha';
import * as test from '../../lib/index.js';


describe('Collection', () => {
  test.collection(Memory
    .configure({})
    .use(mingo())
    .bootstrap()
    .proxy()
  );
});
