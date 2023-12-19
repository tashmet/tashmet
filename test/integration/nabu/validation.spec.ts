import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import mingo from '../../../packages/mingo/dist/index.js';
import Nabu from '../../../packages/nabu/dist/index.js';
import { validationTests } from '../validation.js';
import fsExtra from 'fs-extra';

chai.use(chaiAsPromised);


describe('nabu storage engine validation', () => {
  after(() => {
    fsExtra.removeSync('content');
  });

  validationTests(Nabu
    .configure({
      defaultIO: 'json',
    })
    .use(mingo())
    .io('json', ns => ({
      directory: {
        path: `content/${ns.db}/${ns.collection}`,
        extension: '.json',
        format: 'json',
      }
    }))
    .bootstrap()
    .proxy()
  );
});
