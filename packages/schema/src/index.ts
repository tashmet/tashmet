import {component, Provider} from '@tashmit/core';
import {AjvValidator} from './validator';
import {ValidationConfig} from './interfaces';

export * from './interfaces';
export {validation, ValidationPipeStrategy} from './pipe';

@component({
  providers: [
    AjvValidator,
    Provider.ofInstance<ValidationConfig>('schema.ValidationConfig', {
      collection: 'schemas'
    }),
  ],
})
export default class Schema {}
