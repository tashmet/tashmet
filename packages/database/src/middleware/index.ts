import {Collection} from '../interfaces';
import {withMiddleware} from '../collections/managed';
import {changeObserver} from './changeObserver';

export {changeObserver};
export {logging} from './logging';
export * from './mutation';

export const autoEvent = () => changeObserver(async change => {
  change.collection.emit('change', change);
});

export const withAutoEvent = (collection: Collection) =>
  withMiddleware(collection, [autoEvent()]);
