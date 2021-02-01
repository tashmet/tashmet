import {Pipe} from '@ziqquratu/pipe';
import {omit} from 'lodash';
import {duplexPipeTransform} from './util';

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

export const dict = () => duplexPipeTransform(toList, toDict);
