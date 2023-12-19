import Tashmet from '@tashmet/tashmet';
import Nabu from '../../../packages/nabu/dist/index.js';
import mingo from '../../../packages/mingo/dist/index.js';
import 'mocha';
import fsExtra from 'fs-extra';
import { collectionTests, StoreInspector } from '../collection.js';


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

  collectionTests(proxy, storeInspector);
});
