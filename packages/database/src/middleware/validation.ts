import {
  Document,
  Middleware,
  Validator
} from '../interfaces';

export function validation<T = any>(
  validate: Validator<T>,
): Middleware<T> {
  return {
    insertOne: next => async doc => next(await validate(doc)),
    insertMany: next => async docs => next(await Promise.all(docs.map(doc => validate(doc)))),
    replaceOne: next => async (filter, doc, options) => next(filter, await validate(doc), options),
  };
}
