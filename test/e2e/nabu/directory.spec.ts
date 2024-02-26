import Nabu from '../../../packages/nabu/dist/index.js';
import mingo from '../../../packages/mingo/dist/index.js';
import 'mocha';
import fsExtra from 'fs-extra';
import { StoreInspector } from '../../lib/collection.js';
import * as test from '../../lib/index.js';

describe('nabu using directory', () => {
  const storeInspector: StoreInspector = {
    ids: () => {
      return fsExtra.readdirSync('e2e/testCollection');
    },
    document: id => {
      try {
        const data = fsExtra.readJsonSync(`e2e/testCollection/${id}.json`);
        return { _id: id, ...data };
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
        path: `${ns.db}/${ns.collection}`,
        extension: '.json',
        format: 'json',
      }
    }))
    .use(mingo())
    .bootstrap()
    .proxy();

  describe('collection', () => {
    test.collection(proxy, storeInspector);
  });

  describe('validation', () => {
    test.validation(proxy);
  });
});
