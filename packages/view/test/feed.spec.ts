import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';
import {MemoryCollection} from '@ziqquratu/database';
import {DatabaseService} from '@ziqquratu/database/src/database';
import {DefaultLogger} from '@ziqquratu/core/src/logging/logger';
import {Feed} from '../dist/feed';
import {AggregationTracker} from '../dist/tracker';

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

  const database = new DatabaseService({collections: {}}, new DefaultLogger());
  const collection = new MemoryCollection('test', database);
  let feed: TestFeed;

  before(async () => {
    feed = new TestFeed(new AggregationTracker(
      [], new Promise(resolve => resolve(collection)), true));
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
