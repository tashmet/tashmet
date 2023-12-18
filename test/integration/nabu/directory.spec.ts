import Tashmet from '@tashmet/tashmet';
import Nabu from '../../../packages/nabu/dist/index.js';
import mingo from '../../../packages/mingo/dist/index.js';
import 'mocha';
import fsExtra from 'fs-extra';
import { collectionTests } from './collection.js';


describe('directory', () => {
  let client: Tashmet;

  async function makeCollection() {
    const store = Nabu
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
      .bootstrap();

    client = await Tashmet.connect(store.proxy());

    return client.db('e2e').createCollection('testCollection');
  }

  function storedDoc(id: string | number): any {
    try {
      return fsExtra.readJsonSync(`test/e2e/testCollection/${id}.json`);
    } catch (err) {
      return undefined;
    }
  }

  function storedCollection(): string[] {
    return fsExtra.readdirSync('test/e2e/testCollection');
  }

  after(() => {
    fsExtra.rmdirSync('test/e2e/testCollection');
  });

  collectionTests(makeCollection, storedCollection, storedDoc);
});
