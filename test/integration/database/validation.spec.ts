import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import mingo from '../../../packages/mingo/dist/index.js';
import Memory from '../../../packages/memory/dist/index.js';
import * as test from '../../lib/index.js';

chai.use(chaiAsPromised);

describe('memory storage engine validation', () => {
  test.validation(Memory
    .configure({})
    .use(mingo())
    .bootstrap()
    .proxy()
  );
});
