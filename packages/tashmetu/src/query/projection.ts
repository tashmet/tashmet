import {Projection} from '@ziqquratu/ziqquratu';
import {parseQs} from './common';

export const delimitedProjection = (param: string = 'projection') => {
  return (qs: string) => {
    const pqs = parseQs(qs);
    const projection = (fields: string[]) => fields.reduce((p, field) => {
      p[field] = 1;
      return p;
    }, {} as Projection<any>)

    const value = pqs[param];

    return typeof value === 'string'
      ? ({projection: projection(value.split(','))})
      : ({});
  }
}
