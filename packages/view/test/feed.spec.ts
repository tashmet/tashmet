import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';
import {Collection, memory} from '@tashmit/database/src';
import {DatabaseService} from '@tashmit/database/src/database';
import {DefaultLogger} from '@tashmit/core/src/logging/logger';
import operators from '@tashmit/operators/basic';
import {Feed} from '../dist/feed';
import {TrackingFactory} from '../dist/tracker';

chai.use(chaiAsPromised);

const data = [
  {_id: 1, item: { category: 'cake', type: 'chiffon' }, amount: 10 },
  {_id: 2, item: { category: 'cookies', type: 'chocolate chip'}, amount: 50 },
  {_id: 3, item: { category: 'cookies', type: 'chocolate chip'}, amount: 15 },
  {_id: 4, item: { category: 'cake', type: 'lemon' }, amount: 30 },
  {_id: 5, item: { category: 'cake', type: 'carrot' }, amount: 20 },
];

describe('Feed', () => {
  class TestFeed extends Feed {
    public limit = 2;
    public increment = 2;
  }

  const database = new DatabaseService({collections: {}, operators}, new DefaultLogger());
  let collection: Collection;
  let feed: TestFeed;

  before(async () => {
    collection = await database.createCollection('test', memory());
    feed = new TestFeed(new TrackingFactory(database), 'test', true);
    await collection.insertMany(data);
    await feed.refresh();
  });

  it('should initially have number of documents equal to limit', () => {
    expect(feed.data.length).to.eql(2);
  });

  it('should be able to load more documents', async () => {
    await feed.loadMore();
    expect(feed.data.length).to.eql(4);
    expect(feed.hasMore()).to.eql(true);
  });

  it('should reach end when all documents have been loaded', async () => {
    await feed.loadMore();
    expect(feed.data.length).to.eql(5);
    expect(feed.hasMore()).to.eql(false);
  });
});
