import Tashmit, {Container, Database} from '@tashmit/tashmit';
import {MiddlewareContext} from '@tashmit/database';
import {Pipe} from '@tashmit/pipe';
import {setPipe, unsetPipe} from '../../src/middleware/fields';
import {expect} from 'chai';
import 'mocha';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import operators from '@tashmit/operators/system';

chai.use(chaiAsPromised);

describe('fields', () => {
  let database: Database;
  let container: Container;
  let middlewareContext: MiddlewareContext;

  before(async () => {
    container = Tashmit
      .withConfiguration({operators})
      .bootstrap(Container);

    database = container.resolve(Database);

    middlewareContext = {
      database,
      collection: database.collection('test'),
    }
  });

  describe('setPipe', () => {
    const fact = setPipe({
      name: {$concat: ['$givenName', ' ', '$familyName']},
    });
    let pipe: Pipe;

    before(() => {
      pipe = fact.resolve(container)(middlewareContext);
    });

    it('should add provided fields', async () => {
      return expect(pipe({givenName: 'John', familyName: 'Doe'}))
        .to.eventually.eql({givenName: 'John', familyName: 'Doe', name: 'John Doe'});
    });
    it('should override existing fields', async () => {
      return expect(pipe({givenName: 'John', familyName: 'Doe', name: 'existing'}))
        .to.eventually.eql({givenName: 'John', familyName: 'Doe', name: 'John Doe'});
    });
    it('should not mutate input document', async () => {
      const doc = {givenName: 'John', familyName: 'Doe'};
      await pipe(doc);
      return expect(doc).to.eql({givenName: 'John', familyName: 'Doe'});
    });

    describe('nested fields', () => {
      const fact = setPipe({
        'specs.fuelType': 'unleaded'
      });
      let pipe: Pipe;

      before(async () => {
        pipe = fact.resolve(container)(middlewareContext);
      });

      it('should add provided fields', async () => {
        return expect(pipe({type: 'car', specs: {doors: 4, wheels: 4}}))
          .to.eventually.eql({type: 'car', specs: {doors: 4, wheels: 4, fuelType: 'unleaded'}});
      });
    });
  });

  describe('unsetPipe', () => {
    const fact = unsetPipe(['name']);
    let pipe: Pipe;

    before(async () => {
      pipe = fact.resolve(container)(middlewareContext);
    });

    it('should unset provided fields', async () => {
      return expect(pipe({givenName: 'John', familyName: 'Doe', name: 'John Doe'}))
        .to.eventually.eql({givenName: 'John', familyName: 'Doe'});
    });
    it('should ignore missing fields', async () => {
      return expect(pipe({givenName: 'John', familyName: 'Doe'}))
        .to.eventually.eql({givenName: 'John', familyName: 'Doe'});
    });
    it('should not mutate input document', async () => {
      const doc = {givenName: 'John', familyName: 'Doe', name: 'John Doe'};
      await pipe(doc);
      return expect(doc).to.eql({givenName: 'John', familyName: 'Doe', name: 'John Doe'});
    });

    describe('nested fields', () => {
      const fact = unsetPipe(['specs.fuelType']);
      let pipe: Pipe;

      before(async () => {
        pipe = fact.resolve(container)(middlewareContext);
      });

      it('should unset provided fields', async () => {
        return expect(pipe({type: 'car', specs: {doors: 4, wheels: 4, fuelType: 'unleaded'}}))
          .to.eventually.eql({type: 'car', specs: {doors: 4, wheels: 4}});
      });
    });
  });
});
