import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import 'mocha';

import {bootstrap, component, Provider} from '@ziggurat/tiamat';
import Ziggurat from '../../src';
import {
  caching,
  Collection,
  Database,
  DatabaseConfig,
  memory,
  viewOf,
  RangeFilter,
  SelectorFilter,
  SortingFilter,
  SortingOrder,
  View
} from '../../src';

chai.use(chaiAsPromised);
chai.use(sinonChai);

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
    public range = new RangeFilter({
      length: 2
    });

    public sort = new SortingFilter({
      key: 'amount',
      order: SortingOrder.Descending,
      observe: ['order'],
    });

    public category = new SelectorFilter<string>({
      value: 'all',
      compile: value => ({'item.category': value}),
      disableOn: 'all',
      observe: ['value'],
    });
  }

  @component({
    dependencies: [Ziggurat],
    providers: [
      TestView,
      Provider.ofInstance<DatabaseConfig>('ziggurat.DatabaseConfig', {
        collections: {
          'test': memory()
        },
        use: [caching()]
      })
    ],
    inject: [TestView, 'ziggurat.Database']
  })
  class TestComponent {
    public constructor(public testView: TestView, public database: Database) {}
  }

  let view: TestView;
  let collection: Collection;

  let sandbox: any;

  before(async () => {
    const app = (await bootstrap(TestComponent));
    view = app.testView;
    collection = app.database.collection('test');
  });

  beforeEach(async () => {
    sandbox = sinon.sandbox.create();
    await collection.remove({});
    for (let doc of data) {
      await collection.upsert(doc);
    }
  });

  afterEach(() => {
    view.removeAllListeners();
    sandbox.restore();
  });

  describe('collection events', () => {
    beforeEach(async () => {
      view.category.value = 'cake';
      await view.refresh();
    });

    after(async () => {
      view.category.value = 'all';
      await view.refresh();
    });

    it('should initially have documents', () => {
      expect(view.data.map(d => d._id)).to.eql([4, 5]);
    });

    it('should update when document matching selector is added', (done) => {
      view.on('data-updated', (docs: any[], totalCount: number) => {
        expect(docs.length).to.eql(2);
        expect(totalCount).to.eql(4);
        expect(docs.map(d => d._id)).to.eql([6, 4]);
        done();
      });

      collection.upsert(
        {_id: 6, item: { category: 'cake', type: 'pound'}, amount: 60 });
    });

    it('should not update when document not matching selector is added', (done) => {
      let spy = sandbox.spy();
      view.on('data-updated', spy);

      collection.upsert(
        {_id: 7, item: { category: 'cookies', type: 'gingerbread'}, amount: 25 });

      setTimeout(() => {
        expect(spy).to.have.callCount(0);
        done();
      }, 500);
    });

    it('should update when document is updated to match view', (done) => {
      view.on('data-updated', (docs: any[], totalCount: number) => {
        expect(docs.length).to.eql(2);
        expect(totalCount).to.eql(3);
        expect(docs.map(d => d._id)).to.eql([1, 4]);
        done();
      });

      collection.upsert(
        {_id: 1, item: { category: 'cake', type: 'chiffon' }, amount: 35 }
      );
    });

    it('should update when document matching selector is removed', (done) => {
      view.on('data-updated', (docs: any[], totalCount: number) => {
        expect(docs.length).to.eql(2);
        expect(totalCount).to.eql(2);
        expect(docs.map(d => d._id)).to.eql([4, 5]);
        done();
      });
      collection.remove({_id: 1});
    });

    it('should update when document matching query options is removed', (done) => {
      view.on('data-updated', (docs: any[], totalCount: number) => {
        expect(docs.length).to.eql(2);
        expect(totalCount).to.eql(2);
        expect(docs.map(d => d._id)).to.eql([4, 1]);
        done();
      });
      collection.remove({_id: 5});
    });

    it('should not update when document outside view is removed', (done) => {
      let spy = sandbox.spy();
      view.on('data-updated', spy);

      collection.remove({_id: 2});

      setTimeout(() => {
        expect(spy).to.have.callCount(0);
        done();
      }, 500);
    });
  });

  describe('changing sorting order', () => {
    it('should update data', (done) => {
      expect(view.data.map(d => d._id)).to.eql([2, 4]);

      view.on('data-updated', (docs: any[]) => {
        expect(docs.map(d => d._id)).to.eql([1, 3]);
        done();
      });
      view.sort.order = SortingOrder.Ascending;
    });
  });

  describe('changing selector', () => {
    it('should filter by category', (done) => {
      view.on('data-updated', docs => {
        expect(docs.length).to.eql(2);
        expect(view.totalCount).to.eql(2);
        expect(view.excludedCount).to.eql(0);
        done();
      });
      view.category.value = 'cookies';
    });
  });
});
