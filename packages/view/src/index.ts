import {component} from '@tashmit/core';
import {TrackingFactory} from './tracker';

export * from './decorators/operator';
export {view} from './decorators/view';
export {Feed} from './feed';
export {View} from './view';
export {Item} from './item';
export {ItemSet} from './itemSet';
export {ViewAggregatorAnnotation} from './aggregator';
export {TrackingFactory};

@component({
  providers: [TrackingFactory],
})
export default class ViewComponent {}
