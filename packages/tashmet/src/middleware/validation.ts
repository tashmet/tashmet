import {ChangeSet} from '../changeSet';
import {Middleware, Validator} from '../interfaces';

export function validation<T = any>(
  validate: Validator<T>,
): Middleware<T> {
  return {
    write: next => async cs => next(
      new ChangeSet<T>(await Promise.all(cs.incoming.map(doc => validate(doc))), cs.outgoing)
    ),
  };
}
