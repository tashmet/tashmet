import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import {join} from '../../packages/join/dist';
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

describe('join', () => {
  @component({
    providers: [
      Provider.ofInstance<DatabaseConfig>('ziqquratu.DatabaseConfig', {
        collections: {
          'authors': memory({documents: [
            {_id: 1, name: 'John Doe'},
          ]}),
          'posts': {
            source: memory({documents: [
              {_id: 1, author: 1 },
            ]}),
            use: [
              join({
                collection: 'authors',
                key: 'author',
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
      it('should join author', async () => {
        return expect(collection.findOne({_id: 1}))
          .to.eventually.eql({_id: 1, author: {_id: 1, name: 'John Doe'}});
      });
    });
  });
});
