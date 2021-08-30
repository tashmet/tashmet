import {component} from '@ziqquratu/core';
import {TrackingFactory} from './tracker';

export {filter, FilterConfig} from './decorators/filter';
export {text, TextConfig} from './decorators/text';
export {view} from './decorators/view';
export {Feed} from './feed';
export {View} from './view';
export {Item} from './item';
export {ItemSet} from './itemSet';
export {QueryPropertyAnnotation} from './query';
export {Op} from './decorators/operator';
export {TrackingFactory};

@component({
  providers: [TrackingFactory],
})
export default class ViewComponent {}
