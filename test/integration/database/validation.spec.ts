import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import mingo from '../../../packages/mingo/dist/index.js';
import Memory from '../../../packages/memory/dist/index.js';
import { validationTests } from '../validation.js';

chai.use(chaiAsPromised);

describe('memory storage engine validation', () => {

  function makeStorageEngine () {
    return Memory
      .configure({})
      .use(mingo())
      .bootstrap();
    }

  validationTests(makeStorageEngine);
});
