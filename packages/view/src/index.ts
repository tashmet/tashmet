import {component} from '@ziqquratu/core';
import { Op } from './decorators/operator';
import {TrackingFactory} from './tracker';

export {view} from './decorators/view';
export {Feed} from './feed';
export {View} from './view';
export {Item} from './item';
export {ItemSet} from './itemSet';
export {AggregatorAnnotation} from './aggregator';
// export * as Op from './decorators';
export {TrackingFactory};



@component({
  providers: [TrackingFactory],
})
export default class ViewComponent {}
