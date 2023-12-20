import Nabu from '../../../packages/nabu/dist/index.js';
import mingo from '../../../packages/mingo/dist/index.js';
import 'mocha';
import fsExtra from 'fs-extra';
import { StoreInspector } from '../../lib/collection.js';
import * as test from '../../lib/index.js';

describe('directory', () => {
  const storeInspector: StoreInspector = {
    ids: () => {
      return fsExtra.readdirSync('test/e2e/testCollection');
    },
    document: id => {
      try {
        return fsExtra.readJsonSync(`test/e2e/testCollection/${id}.json`);
      } catch (err) {
        return undefined;
      }
    }
  }

  const proxy = Nabu
    .configure({
      defaultIO: 'json'
    })
    .io('json', ns => ({
      directory: {
        path: `test/${ns.db}/${ns.collection}`,
        extension: '.json',
        format: 'json',
      }
    }))
    .use(mingo())
    .bootstrap()
    .proxy();

  after(() => {
    fsExtra.rmdirSync('test/e2e/testCollection');
  });

  test.collection(proxy, storeInspector);

  test.validation(proxy);
});
