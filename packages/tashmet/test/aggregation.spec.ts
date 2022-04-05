/*
import {expect} from 'chai';
import 'mocha';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {QueryAggregator} from '../dist';

chai.use(chaiAsPromised);

describe('QueryAggregator', () => {
  describe('to pipeline', () => {
    it('should contain a match stage when filter is provided', () => {
      expect(new QueryAggregator({foo: 'bar'}, {}).pipeline).to.eql([
        {$match: {foo: 'bar'}}
      ]);
    });
  });

  describe('from pipeline', () => {
    it('should not aquire filter when match is not first step', () => {
      const qa = QueryAggregator.fromPipeline([
        {$sort: {foo: 1}},
        {$match: {foo: 'bar'}},
      ]);
      expect(qa.filter).to.eql({});
    });
    it('should aquire filter when match is first step', () => {
      const qa = QueryAggregator.fromPipeline([
        {$match: {foo: 'bar'}},
        {$sort: {foo: 1}},
      ]);
      expect(qa.filter).to.eql({foo: 'bar'});
    });
    it('should aquire sort', () => {
      const qa = QueryAggregator.fromPipeline([
        {$match: {foo: 'bar'}},
        {$sort: {foo: 1}},
      ]);
      expect(qa.options).to.eql({sort: {foo: 1}});
    });
    it('should aquire limit when placed after $sort', () => {
      const qa = QueryAggregator.fromPipeline([
        {$sort: {foo: 1}},
        {$limit: 1},
      ]);
      expect(qa.options).to.eql({sort: {foo: 1}, limit: 1});
    });
    it('should aquire limit only when placed before $sort', () => {
      const qa = QueryAggregator.fromPipeline([
        {$limit: 10},
        {$sort: {foo: 1}},
      ]);
      expect(qa.options).to.eql({limit: 10});
    });
    it('should aquire both skip and limit when skip placed first', () => {
      const qa = QueryAggregator.fromPipeline([
        {$skip: 1},
        {$limit: 1},
      ]);
      expect(qa.options).to.eql({skip: 1, limit: 1});
    });
    it('should aquire both skip and limit when limit placed first', () => {
      const qa = QueryAggregator.fromPipeline([
        {$limit: 1},
        {$skip: 1},
      ]);
      expect(qa.options).to.eql({skip: 1, limit: 1});
    });
  });
});
*/
