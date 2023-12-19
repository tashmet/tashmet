import Tashmet from '../../../packages/tashmet/dist/index.js';
import Nabu from '../../../packages/nabu/dist/index.js';
import mingo from '../../../packages/mingo/dist/index.js';
import 'mocha';
import fsExtra from 'fs-extra';
import { StoreInspector, collectionTests } from './collection.js';

describe('arrayInFile', async () => {
  let client: Tashmet;

  async function makeCollection() {
    const store = Nabu
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
      .bootstrap();

    client = await Tashmet.connect(store.proxy());

    return client.db('e2e').createCollection('testCollection');
  }

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

  after(() => {
    fsExtra.removeSync('test/e2e.json');
  });

  collectionTests(makeCollection, storeInspector);
});
