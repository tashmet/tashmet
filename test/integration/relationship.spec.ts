import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import {relationship} from '../../packages/aggregation/dist';
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
              relationship({
                to: 'authors',
                localField: 'author',
                foreignField: '_id',
                single: true,
              })
            ],
          }
        },
      })
    ],
    inject: [Database]
  })
  class TestComponent {
    public constructor(public database: Database) {}
  }

  let posts: Collection;
  let authors: Collection;

  before(async () => {
    const app = (await bootstrap(TestComponent));
    posts = await app.database.collection('posts');
    authors = await app.database.collection('authors');
  });

  describe('outgoing', () => {
    afterEach(() => {
      posts.removeAllListeners();
    });

    describe('findOne', () => {
      it('should join author', async () => {
        return expect(posts.findOne({_id: 1}))
          .to.eventually.eql({_id: 1, author: {_id: 1, name: 'John Doe'}});
      });
    });

    describe('insertOne', () => {
      it('should insert new author', async () => {
        await posts.insertOne({_id: 2, author: {_id: 2, name: 'Jane Doe'}});

        return expect(authors.findOne({_id: 2}))
          .to.eventually.eql({_id: 2, name: 'Jane Doe'});
      });
    });
  });
});
