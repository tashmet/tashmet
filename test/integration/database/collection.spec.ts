import mingo from '../../../packages/mingo/dist/index.js';
import Memory from '../../../packages/memory/dist/index.js';
import 'mingo/init/system';
import 'mocha';
import { collectionTests } from '../collection.js';


describe('Collection', () => {
  collectionTests(Memory
    .configure({})
    .use(mingo())
    .bootstrap()
    .proxy()
  );
});
