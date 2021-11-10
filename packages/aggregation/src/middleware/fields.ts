import {io} from '@tashmit/pipe';
import {aggregationPipe} from './pipe';

export type FieldsConfig = Record<string, any>;

export const setPipe = (config: FieldsConfig) => aggregationPipe([
  {$set: config}
]);

export const unsetPipe = (fields: string[]) => aggregationPipe([
  {$project: fields.reduce<FieldsConfig>((acc, key) => ({...acc, ...{[key]: 0}}), {})},
])

export const fields = (config: Record<string, any>) => io({
  input: unsetPipe(Object.keys(config)),
  output: setPipe(config),
});
