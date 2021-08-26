import {component} from '@ziqquratu/core';
import {TrackingMiddlewareFactory, DocumentTrackingService} from './tracker';

export {filter, FilterConfig} from './decorators/filter';
export {text, TextConfig} from './decorators/text';
export {view} from './decorators/view';
export {Feed} from './feed';
export {View} from './view';
export {Item} from './item';
export {ItemSet} from './itemSet';
export {tracking} from './tracker';
export {QueryPropertyAnnotation} from './query';
export {Op} from './decorators/operator';

@component({
  factories: [TrackingMiddlewareFactory],
  providers: [DocumentTrackingService],
})
export default class ViewComponent {}
