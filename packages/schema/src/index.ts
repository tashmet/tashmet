import {component, Provider} from '@tashmit/core';
import {AjvValidator} from './validator';
import {ValidationConfig} from './interfaces';
import {ValidationPipeFactory} from './pipe';

export * from './interfaces';
export {validation, ValidationPipeStrategy} from './pipe';

@component({
  providers: [
    AjvValidator,
    Provider.ofInstance<ValidationConfig>('schema.ValidationConfig', {
      collection: 'schemas'
    }),
  ],
  factories: [ValidationPipeFactory]
})
export default class Schema {}
