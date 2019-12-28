import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import {bootstrap, component, Provider} from '@ziggurat/tiamat';
import Ziggurat from '../../src';
import {
  DatabaseConfig,
  memory,
  viewOf,
  FeedFilter,
  SortingFilter,
  SortingOrder,
  View
} from '../../src';

chai.use(chaiAsPromised);

const data = [
  {_id: 1, item: { category: 'cake', type: 'chiffon' }, amount: 10 },
  {_id: 2, item: { category: 'cookies', type: 'chocolate chip'}, amount: 50 },
  {_id: 3, item: { category: 'cookies', type: 'chocolate chip'}, amount: 15 },
  {_id: 4, item: { category: 'cake', type: 'lemon' }, amount: 30 },
  {_id: 5, item: { category: 'cake', type: 'carrot' }, amount: 20 },
];

describe('view', () => {
  @viewOf('test')
  class TestView extends View {
    public feed = new FeedFilter({
      limit: 3,
      increment: 3
    });

    public sort = new SortingFilter({
      key: 'amount',
      order: SortingOrder.Descending,
      observe: ['order'],
    });
  }

  @component({
    dependencies: [Ziggurat],
    providers: [
      TestView,
      Provider.ofInstance<DatabaseConfig>('ziggurat.DatabaseConfig', {
        collections: {
          'test': memory(data)
        }
      })
    ],
    inject: [TestView]
  })
  class TestComponent {
    public constructor(public testView: TestView) {}
  }

  let view: TestView;

  before(async () => {
    view = (await bootstrap(TestComponent)).testView;
  });

  afterEach(() => {
    view.removeAllListeners();
  });

  it('should initially have no documents', () => {
    expect(view.data).to.eql([]);
  });

  it('should have documents after refresh', async () => {
    const docs = await view.refresh();
    expect(docs.length).to.eql(3);
    expect(view.totalCount).to.eql(5);
    expect(view.excludedCount).to.eql(2);
  });

  it('should have sorted the documents', () => {
    expect(view.data[0]._id).to.eql(2);
  });

  it('should change to sorting order', (done) => {
    view.on('data-updated', docs => {
      expect(docs[0]._id).to.eql(1);
      done();
    });
    view.sort.order = SortingOrder.Ascending;
  });

  it('should load more documents', (done) => {
    view.on('data-updated', docs => {
      expect(docs.length).to.eql(5);
      expect(view.excludedCount).to.eql(0);
      done();
    });
    view.feed.loadMore();
  });
});
