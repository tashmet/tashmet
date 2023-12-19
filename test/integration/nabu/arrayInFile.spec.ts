import Nabu from '../../../packages/nabu/dist/index.js';
import mingo from '../../../packages/mingo/dist/index.js';
import 'mocha';
import fsExtra from 'fs-extra';
import { StoreInspector } from '../../lib/collection.js';
import * as test from '../../lib/index.js';

describe('arrayInFile', async () => {
  after(() => {
    fsExtra.removeSync('test/e2e.json');
  });

  const storeInspector: StoreInspector = {
    ids: () => {
      const db = fsExtra.readJsonSync(`test/e2e.json`);
      return db.testCollection;
    },
    document: id => {
      const db = fsExtra.readJsonSync(`test/e2e.json`);
      return db.testCollection.find((doc: any) => doc._id === id);
    }
  }

  const proxy = Nabu
    .configure({
      defaultIO: 'json'
    })
    .io('json', ns => ({
      arrayInFile: {
        path: `test/${ns.db}.json`,
        format: 'json',
        field: ns.collection
      }
    }))
    .use(mingo())
    .bootstrap()
    .proxy();

  test.collection(proxy, storeInspector);
});
