import {Pipe, IOGate} from '@ziqquratu/pipe';
import {omit} from 'lodash';

export const toList: Pipe<any, any[]> = async dict => {
  return Object.keys(dict).reduce((list, key) => {
    list.push(Object.assign({_id: key}, dict[key]));
    return list
  }, [] as any[])
}

export const toDict: Pipe<any[], any> = async list => {
  return list.reduce((acc, item) => {
    acc[item._id] = omit(item, ['_id']);
    return acc;
  }, {})
}

export const dict = () => ({ input: toList, output: toDict }) as IOGate<Pipe>;
