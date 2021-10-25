import {io} from '@tashmit/pipe';
import {aggregationPipe} from './pipe';

export const fields = (config: Record<string, any>) => io({
  input: aggregationPipe([{$set: config}]),
  output: aggregationPipe([
    {$project: Object.keys(config).reduce((acc, key) => Object.assign(acc, {[key]: 0}), {})}
  ]),
});
