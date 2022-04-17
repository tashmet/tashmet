import 'mingo/init/basic';
import {InsertCommandHandler} from '../../src/commands/insert';
//import {MingoStore} from '../../src/store';
import {expect} from 'chai';
import * as chai from 'chai';
import * as sinon from 'sinon';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';
import 'mocha';
import { MingoDatabaseStore } from '../../src/command';

chai.use(chaiAsPromised)
chai.use(sinonChai);

let store: MingoDatabaseStore;

describe('InsertCommandHandler', () => {
  describe('successful insert', () => {
    before(() => {
      store = new MingoDatabaseStore('testdb', {'test': []});
    });

    it('should return correct result on success', () => {
      const result = new InsertCommandHandler(store, {}).execute({
        insert: 'test',
        documents: [{title: 'foo'}, {title: 'bar'}]
      });
      expect(result).to.eql({n: 2, ok: 1});
    });

    it('should have inserted the documents into the store', () => {
      expect(store.collections['test'].length).to.eql(2);
      expect(store.collections['test'][0].title).to.eql('foo');
      expect(store.collections['test'][1].title).to.eql('bar');
    });
  });

  describe('failing insert, not ordered', () => {
    before(() => {
      store = new MingoDatabaseStore('testdb', {'test': [{_id: 1, title: 'foo'}]});
    });

    it('should insert remaining documents after initial fail', () => {
      const result = new InsertCommandHandler(store, {}).execute({
        insert: 'test',
        documents: [{_id: 1, title: 'foo'}, {_id: 2, title: 'bar'}],
      });
      expect(result).to.eql({n: 1, ok: 1, writeErrors: [{index: 0, errMsg: 'Duplicate key error'}]});
    });
  });

  describe('failing insert, ordered', () => {
    before(() => {
      store = new MingoDatabaseStore('testdb', {'test': [{_id: 1, title: 'foo'}]});
    });

    it('should not insert remaining documents after initial fail', () => {
      const result = new InsertCommandHandler(store, {}).execute({
        insert: 'test',
        documents: [{_id: 1, title: 'foo'}, {_id: 2, title: 'bar'}],
        ordered: true,
      });
      expect(result).to.eql({n: 0, ok: 1, writeErrors: [{index: 0, errMsg: 'Duplicate key error'}]});
    });
  });
});
