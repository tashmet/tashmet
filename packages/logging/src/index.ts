import {component} from '@ziqquratu/ioc';
import {DefaultLogger} from './logger';

export * from './interfaces';
export {consoleWriter} from './console';

@component({
  providers: [DefaultLogger]
})
export default class Logging {}
