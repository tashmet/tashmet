import Nabu from '../../../packages/nabu/dist/index.js';
import mingo from '../../../packages/mingo/dist/index.js';
import 'mocha';
import fsExtra from 'fs-extra';
import { StoreInspector } from '../../lib/collection.js';
import * as test from '../../lib/index.js';

describe('objectInFile', () => {
  const proxy = Nabu
    .configure({
      defaultIO: 'json'
    })
    .io('json', ns => ({
      objectInFile: {
        path: `test/${ns.db}.json`,
        format: 'json',
        field: ns.collection
      }
    }))
    .use(mingo())
    .bootstrap()
    .proxy();

  const storeInspector: StoreInspector = {
    ids: () => {
      const db = fsExtra.readJsonSync(`test/e2e.json`);
      return Object.keys(db.testCollection);
    },
    document: id => {
      const db = fsExtra.readJsonSync(`test/e2e.json`);
      const doc = db.testCollection[id];
      return doc === undefined
        ? undefined
        : Object.assign({ _id: id, }, db.testCollection[id]);
    }
  }

  test.collection(proxy, storeInspector);
});
