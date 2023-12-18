import Tashmet from '../../../packages/tashmet/dist/index.js';
import Nabu from '../../../packages/nabu/dist/index.js';
import mingo from '../../../packages/mingo/dist/index.js';
import 'mocha';
import fsExtra from 'fs-extra';
import { collectionTests } from './collection.js';

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

  function storedDoc(id: string): any {
    const db = fsExtra.readJsonSync(`test/e2e.json`);
    const doc = db.testCollection[id];
    return doc === undefined
      ? undefined
      : Object.assign({ _id: id, }, db.testCollection[id]);
  }

  function storedCollection(): any[] {
    const db = fsExtra.readJsonSync(`test/e2e.json`);
    return Object.entries(db.testCollection)
      .map(([ _id, doc ]) => Object.assign({ _id }, doc as Document));
  }

  collectionTests(makeCollection, storedCollection, storedDoc);
});
