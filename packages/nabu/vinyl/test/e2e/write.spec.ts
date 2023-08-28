import Tashmet, { Collection } from '@tashmet/tashmet';
import Nabu from '@tashmet/nabu';
import Mingo from '@tashmet/mingo';
import 'mingo/init/system';
import 'mocha';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import * as fs from 'fs-extra';
import Vinyl from '../../dist';

chai.use(chaiAsPromised);
chai.use(sinonChai);

/*
function storedDoc(id: string | number): any {
  return fs.readJsonSync(`test/e2e/testCollection/${id}.json`);
}

function storedFiles(): string[] {
  return fs.readdirSync('test/e2e/testCollection');
}
*/

describe.skip('write', () => {
  let nabu: Nabu;

  before(async () => {
    nabu = await Tashmet
      .configure()
      .use(Mingo, {})
      .use(Nabu, {})
      .use(Vinyl, {watch: false})
      .bootstrap(Nabu);
  });


  describe('write JSON', () => {
    it('should serialize content and write it to disk', async () => {
      try {
        /*
        const docs = await nabu
          .source([{foo: 'bar'}])
          .pipe({$project: {path: 'test/e2e/write-test.yaml', content: '$$ROOT'}})
          .write();
          */

        await nabu.source([{path: 'test/e2e/write-test.yaml', content: null}]).write()
      } catch (err) {
        console.log(err);
      }
      //expect(await storedDoc(id))
        //.to.eql({_id: id, item: { category: 'brownies', type: 'blondie' }, amount: 10 });
    });
  });
});
