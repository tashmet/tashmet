import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import Tashmit, {Database} from '../../packages/tashmit'
import {relationship} from '../../packages/aggregation/dist';
import operators from '../../packages/operators/system';

chai.use(chaiAsPromised);

describe('join', () => {
  const db = Tashmit
    .withConfiguration({operators})
    .collection('authors', [{_id: 1, name: 'John Doe'}])
    .collection('posts', {
      source: [{_id: 1, author: 1 }],
      use: [
        relationship({
          to: 'authors',
          localField: 'author',
          foreignField: '_id',
          single: true,
        })
      ]
    })
    .bootstrap(Database);

  const posts = db.collection('posts');
  const authors = db.collection('authors');

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
