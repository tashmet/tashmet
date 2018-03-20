import {classDecorator, Abstract, Newable} from '@ziggurat/meta';
import {ServiceIdentifier} from '@ziggurat/tiamat';
import {Controller} from '../database/controller';

export class ViewOfAnnotation {
  public constructor(
    public key: ServiceIdentifier<Controller<any>>
  ) {}
}

export const viewOf = <(key: ServiceIdentifier<Controller<any>>) => any>
  classDecorator(ViewOfAnnotation);
