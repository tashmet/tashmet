import {Pipe, IOGate} from '@ziqquratu/pipe';
import {omit} from 'lodash';

export function toList(): Pipe<any, any[]> {
  return async dict => Object.keys(dict).reduce((list, key) => {
    list.push(Object.assign({_id: key}, dict[key]));
    return list
  }, [] as any[])
}

export function toDict(): Pipe<any[], any> {
  return async list => list.reduce((acc, item) => {
    acc[item._id] = omit(item, ['_id']);
    return acc;
  }, {})
}

export const dict = () => ({ input: toList(), output: toDict() }) as IOGate<Pipe>;
