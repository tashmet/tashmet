import {expect} from 'chai';
import 'mocha';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {ChangeSet} from '@tashmet/engine/src/changeSet';

chai.use(chaiAsPromised);

describe('ChangeSet', () => {
  describe('fromInsert', () => {
    it('should create change set with only incoming documents', () => {
      const cs = ChangeSet.fromInsert([{_id: 1}, {_id: 2}]);
      expect (cs.incoming).to.eql([{_id: 1}, {_id: 2}]);
      expect (cs.outgoing).to.eql([]);
    })
  });

  describe('fromDelete', () => {
    it('should create change set with only outgoing documents', () => {
      const cs = ChangeSet.fromDelete([{_id: 1}, {_id: 2}]);
      expect (cs.incoming).to.eql([]);
      expect (cs.outgoing).to.eql([{_id: 1}, {_id: 2}]);
    });
  });

  describe('fromReplace', () => {
    it('should create change set with both incoming and outgoing documents', () => {
      const cs = ChangeSet.fromReplace({_id: 1}, {_id: 2});
      expect (cs.incoming).to.eql([{_id: 2}]);
      expect (cs.outgoing).to.eql([{_id: 1}]);
    });
  });

  describe('insertions', () => {
    it('should contain only incoming documents that does not also exist in outgoing', () => {
      const cs = new ChangeSet([{_id: 1}, {_id: 2}], [{_id: 2}]);
      expect (cs.insertions).to.eql([{_id: 1}]);
    });
  });

  describe('deletions', () => {
    it('should contain only outgoing documents that does not also exist in incoming', () => {
      const cs = new ChangeSet([{_id: 1}], [{_id: 1}, {_id: 2}]);
      expect (cs.deletions).to.eql([{_id: 2}]);
    });
  });

  describe('replacements', () => {
    it('should contain only documents present in both incoming and outgoing', () => {
      const cs = new ChangeSet([{_id: 1}], [{_id: 1}, {_id: 2}]);
      expect (cs.replacements).to.eql([{_id: 1}]);
    });
  });

  describe('toInverse', () => {
    it('should swap incoming with outgoing documents', () => {
      const cs = new ChangeSet([{_id: 1}], [{_id: 1}, {_id: 2}]).toInverse();
      expect(cs.incoming).to.eql([{_id: 1}, {_id: 2}]);
      expect(cs.outgoing).to.eql([{_id: 1}]);
    });
  });

  describe('toChanges', () => {
    it('should create insert change', () => {
      const cs = ChangeSet.fromInsert([{_id: 1}]);
      const changes = cs.toChanges({db: 'test', coll: 'test'});
      expect(changes).to.have.length(1);
      expect(changes[0].operationType).to.eql('insert');
      expect(changes[0].documentKey).to.eql(1);
      expect(changes[0].fullDocument).to.eql({_id: 1});
    });

    it('should create delete change', () => {
      const cs = ChangeSet.fromDelete([{_id: 1}]);
      const changes = cs.toChanges({db: 'test', coll: 'test'});
      expect(changes).to.have.length(1);
      expect(changes[0].operationType).to.eql('delete');
      expect(changes[0].documentKey).to.eql(1);
      expect(changes[0].fullDocument).to.eql({_id: 1});
    });

    it('should create replace change', () => {
      const cs = ChangeSet.fromReplace({_id: 1, value: 'old'}, {_id: 1, value: 'new'});
      const changes = cs.toChanges({db: 'test', coll: 'test'});
      expect(changes).to.have.length(1);
      expect(changes[0].operationType).to.eql('replace');
      expect(changes[0].documentKey).to.eql(1);
      expect(changes[0].fullDocument).to.eql({_id: 1, value: 'new'});
    });
  });
});
