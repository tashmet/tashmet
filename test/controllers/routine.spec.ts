import {RoutineAggregator} from '../../src/controllers/routine';
import {CollectionController} from '../../src/controllers/collection';
import {routine, Routine} from '../../src/index';
import {decorate, provider} from '@ziggurat/tiamat';
import {expect} from 'chai';
import 'mocha';

@routine({
  appliesTo: ['tag1', 'tag2']
})
class Routine1 extends Routine<CollectionController> {}

@routine({
  appliesTo: ['tag3']
})
class Routine2 extends Routine<CollectionController> {}

describe('RoutineAggregator', () => {
  let ra = new RoutineAggregator();
  let r1 = new Routine1();
  let r2 = new Routine2();

  ra.addRoutine(r1);
  ra.addRoutine(r2);

  describe('collection without tags', () => {
    @provider({
      for: 'foo'
    })
    class UntaggedCollection extends CollectionController {}

    it('should not have any routines', () => {
      expect(ra.getRoutines(new UntaggedCollection()))
        .to.be.an('array').that.is.empty;
    });
  });

  describe('collection matching no routines', () => {
    @provider({
      for: 'bar',
      tagged: ['tag4']
    })
    class TaggedCollection extends CollectionController {}

    it('should have one routine', () => {
      expect(ra.getRoutines(new TaggedCollection()))
        .to.be.an('array').that.is.empty;
    });
  });

  describe('collection matching a single routine', () => {
    @provider({
      for: 'bar',
      tagged: ['tag1']
    })
    class TaggedCollection extends CollectionController {}

    it('should have one routine', () => {
      expect(ra.getRoutines(new TaggedCollection()))
        .to.be.an('array')
        .that.has.length(1)
        .and.contains(r1);
    });
  });

  describe('collection matching multipe routines', () => {
    @provider({
      for: 'bar',
      tagged: ['tag1', 'tag3']
    })
    class TaggedCollection extends CollectionController {}

    it('should have multiple routines', () => {
      expect(ra.getRoutines(new TaggedCollection()))
        .to.be.an('array')
        .that.has.length(2)
        .and.contains.members([r1, r2]);
    });
  });

  describe('collection matching routines on different base classes', () => {
    @provider({
      for: 'foo',
      tagged: ['tag2']
    })
    class TaggedCollection1 extends CollectionController {}

    @provider({
      for: 'bar',
      tagged: ['tag3']
    })
    class TaggedCollection2 extends TaggedCollection1 {}

    it('should have multiple routines', () => {
      expect(ra.getRoutines(new TaggedCollection2()))
        .to.be.an('array')
        .that.has.length(2)
        .and.contains.members([r1, r2]);
    });
  });
});
