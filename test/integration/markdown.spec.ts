import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import * as showdown from 'showdown';
import {markdown} from '../../packages/markdown/dist';
import {
  bootstrap,
  component,
  Provider,
  Collection,
  Database,
  DatabaseConfig,
  memory,
} from '../../packages/ziqquratu/dist';

chai.use(chaiAsPromised);

describe('markdown', () => {
  @component({
    providers: [
      Provider.ofInstance<DatabaseConfig>('ziqquratu.DatabaseConfig', {
        collections: {
          'posts': {
            source: memory({documents: [
              {_id: 1, content: '# h1 Heading'},
            ]}),
            use: [
              markdown({
                converter: new showdown.Converter(),
                key: 'content',
              })
            ],
          }
        },
      })
    ],
    inject: ['ziqquratu.Database']
  })
  class TestComponent {
    public constructor(public database: Database) {}
  }

  let collection: Collection;

  before(async () => {
    const app = (await bootstrap(TestComponent));
    collection = await app.database.collection('posts');
  });

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
