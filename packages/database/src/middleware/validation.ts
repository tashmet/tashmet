import {
  AggregationPipeline,
  Document,
  Filter,
  Middleware,
  MethodMiddleware,
  Validator
} from '../interfaces';

export function validation<T = any>(
  validate: Validator<T>,
  rules: Document,
): Middleware<T> {

  const makeFilter = (filter: Filter<T> | undefined) =>
    filter ? {$and: [filter, rules]} : rules

  const makePipeline = (pipeline: AggregationPipeline) =>
    ([{$match: rules}] as AggregationPipeline).concat(pipeline);

  const methods: MethodMiddleware = {
    insertOne: next => async doc => next(validate(doc)),
    insertMany: next => async docs => next(docs.map(doc => validate(doc))),
    replaceOne: next => async (filter, doc, options) => next(filter, validate(doc), options),
    find: next => (filter, options) => next(makeFilter(filter), options),
    findOne: next => filter => next(makeFilter(filter)),
    aggregate: next => pipeline => next(makePipeline(pipeline)),
  }
  return {methods};
}
