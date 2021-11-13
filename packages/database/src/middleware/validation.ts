import {Document, Middleware, MethodMiddleware} from '../interfaces';
import {Query} from 'mingo';

export function validation(validator: Document): Middleware {
  const query = new Query(validator as any);
  const validate = (doc: any) => {
    if (query.test(doc)) {
      return doc;
    } else {
      throw new Error(`validation of document failed`);
    }
  }

  const methods: MethodMiddleware = {
    insertOne: next => async doc => next(validate(doc)),
    insertMany: next => async docs => next(docs.map(doc => validate(doc))),
    replaceOne: next => async (filter, doc, options) => next(filter, validate(doc), options),
  }
  return {methods};
}
