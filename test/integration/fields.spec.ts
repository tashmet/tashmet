import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import {fields} from '../../packages/aggregation/dist';
import Tashmit, {Database} from '../../packages/tashmit'
import operators from '../../packages/operators/system';

chai.use(chaiAsPromised);

describe('fields', () => {
  const db = Tashmit
    .withConfiguration({operators})
    .collection('users', {
      source: [{_id: 1, givenName: 'John', familyName: 'Doe' }],
      use: [
        fields({
          name: {$concat: ['$givenName', ' ', '$familyName']},
        })
      ]
    })
    .bootstrap(Database);

  let users = db.collection('users');

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
