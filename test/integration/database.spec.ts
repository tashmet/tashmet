import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import {bootstrap, component, Provider} from '@ziggurat/tiamat';
import Ziggurat from '../../src';
import {Database, DatabaseConfig, memory} from '../../src';

chai.use(chaiAsPromised);

describe('database', () => {
  @component({
    dependencies: [Ziggurat],
    providers: [
      Provider.ofInstance<DatabaseConfig>('ziggurat.DatabaseConfig', {
        collections: {
          'test': memory([{name: 'doc1'}, {name: 'doc2'}])
        }
      })
    ],
    inject: ['ziggurat.Database']
  })
  class TestComponent {
    public constructor(public database: Database) {}
  }

  let db: Database;

  before(async () => {
    db = (await bootstrap(TestComponent)).database;
  });

  it('should have registered collection in configuration', async () => {
    const collection = db.collection('test');
    expect(collection.count()).to.eventually.eql(2);
  });

  it('should fail to create collection with existing name', () => {
    expect(() => db.createCollection('test', memory()))
      .to.throw("A collection named 'test' already exists");
  });
});
