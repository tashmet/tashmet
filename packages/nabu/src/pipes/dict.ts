import {IOGate, Pipe} from '@ziqquratu/pipe';
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

class DictTransformer implements IOGate {
  input = toList;
  output = toDict;
}

export const dict = () => new DictTransformer();

/*
class ListTransformer implements IOGate {
  public async input(data: any) {
    const list: any[] = [];
    for (const key of Object.keys(data)) {
      list.push({_id: key, ...data[key]})
    }
    return list;
  }

  public async output(data: any[]) {
    return data.reduce((acc, curr) => {
      acc[curr._id] = curr;
      return acc;
    }, {})
  }
}
*/