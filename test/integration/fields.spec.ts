import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import {fields} from '../../packages/aggregation/dist';
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

describe('fields', () => {
  @component({
    providers: [
      Provider.ofInstance<DatabaseConfig>('ziqquratu.DatabaseConfig', {
        collections: {
          'users': {
            source: memory({documents: [
              {_id: 1, givenName: 'John', familyName: 'Doe' },
            ]}),
            use: [
              fields({
                name: {$concat: ['$givenName', ' ', '$familyName']},
              }),
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

  let users: Collection;

  before(async () => {
    const app = (await bootstrap(TestComponent));
    users = await app.database.collection('users');
  });

  describe('outgoing', () => {
    afterEach(() => {
      users.removeAllListeners();
    });

    describe('findOne', () => {
      it('should have additional field', async () => {
        return expect(users.findOne({_id: 1}))
          .to.eventually.eql({_id: 1, givenName: 'John', familyName: 'Doe', name: 'John Doe'});
      });
    });
  });
});
