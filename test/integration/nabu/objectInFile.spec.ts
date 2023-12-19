import Tashmet from '../../../packages/tashmet/dist/index.js';
import Nabu from '../../../packages/nabu/dist/index.js';
import mingo from '../../../packages/mingo/dist/index.js';
import 'mocha';
import fsExtra from 'fs-extra';
import { StoreInspector, collectionTests } from '../collection.js';

describe('objectInFile', () => {
  let client: Tashmet;
  let store: Nabu;

  async function makeCollection() {
    store = Nabu
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
      .bootstrap();

    client = await Tashmet.connect(store.proxy());

    return client.db('e2e').createCollection('testCollection');
  }

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

  collectionTests(makeCollection, storeInspector);
});
