import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';
import Tashmit from '@tashmit/tashmit';
import operators from '@tashmit/operators/basic';
import {view, Feed, limit} from '../dist';

chai.use(chaiAsPromised);


describe('Feed', () => {
  @view({collection: 'test'})
  class TestFeed extends Feed {
    @limit limit = 2; // TODO: Should inherit decorator from base class.
    increment = 2;
  }

  const feed = Tashmit
    .withConfiguration({operators})
    .collection('test', [
      {_id: 1, item: { category: 'cake', type: 'chiffon' }, amount: 10 },
      {_id: 2, item: { category: 'cookies', type: 'chocolate chip'}, amount: 50 },
      {_id: 3, item: { category: 'cookies', type: 'chocolate chip'}, amount: 15 },
      {_id: 4, item: { category: 'cake', type: 'lemon' }, amount: 30 },
      {_id: 5, item: { category: 'cake', type: 'carrot' }, amount: 20 },
    ])
    .provide(TestFeed)
    .bootstrap(TestFeed)

  before(async () => {
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
