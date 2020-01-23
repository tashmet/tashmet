import {component} from '@ziqquratu/ioc';
import {DefaultLogger} from './logger';

export * from './interfaces';

@component({
  providers: [DefaultLogger]
})
export default class Logging {}
