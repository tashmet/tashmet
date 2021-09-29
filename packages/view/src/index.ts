import {component} from '@ziqquratu/core';
import {TrackingFactory} from './tracker';
import * as Op from './decorators/operator';

export {view} from './decorators/view';
export {Feed} from './feed';
export {View} from './view';
export {Item} from './item';
export {ItemSet} from './itemSet';
export {ViewAggregatorAnnotation} from './aggregator';
export {TrackingFactory};
export {Op};

@component({
  providers: [TrackingFactory],
})
export default class ViewComponent {}
