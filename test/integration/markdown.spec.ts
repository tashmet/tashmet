import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import * as showdown from 'showdown';
import {markdown} from '../../packages/markdown/dist';
import Tashmit, {Database} from '../../packages/tashmit'
import operators from '../../packages/operators/system';

chai.use(chaiAsPromised);

describe('markdown', () => {
  const db = Tashmit
    .withConfiguration({operators})
    .collection('users', {
      source: [{_id: 1, content: '# h1 Heading'}],
      use: [
        markdown({
          converter: new showdown.Converter(),
          key: 'content',
        })
      ]
    })
    .bootstrap(Database);

  const collection = db.collection('users');

  describe('outgoing', () => {
    afterEach(() => {
      collection.removeAllListeners();
    });

    describe('findOne', () => {
      it('should convert content to html', async () => {
        return expect(collection.findOne({_id: 1}))
          .to.eventually.eql({_id: 1, content: '<h1 id="h1heading">h1 Heading</h1>'});
      });
    });
  });
});
