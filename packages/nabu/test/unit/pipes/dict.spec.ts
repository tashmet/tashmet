import {toList, toDict} from '../../../src/pipes/dict';
import {expect} from 'chai';
import 'mocha';
import * as chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

describe('dict', () => {
  describe('toList', () => {
    it('should provide a list for valid dictionary', () => {
      const dict = {
        doc1: {title: 'foo'},
        doc2: {title: 'bar'},
      };
      return toList(dict).then(list => {
        expect(list).to.eql([
          {_id: 'doc1', title: 'foo'},
          {_id: 'doc2', title: 'bar'}
        ]);
      });
    });

    it('should do nothing given a list', () => {
      return toList([{_id: 'doc1'}]).then(list => {
        expect(list).to.eql([{_id: 'doc1'}]);
      })
    });
  });

  describe('toDict', () => {
    it('should provide a dictionary for valid list', () => {
      const list = [
        {_id: 'doc1', title: 'foo'},
        {_id: 'doc2', title: 'bar'},
      ];
      return toDict(list).then(dict => {
        expect(dict).to.eql({
          doc1: {title: 'foo'},
          doc2: {title: 'bar'},
        });
      });
    });
  });
});
