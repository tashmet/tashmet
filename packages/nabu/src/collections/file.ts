import {FileConfig} from '../interfaces';
import {buffer} from './buffer';
import {FileStreamFactory, dict, ObjectPipeTransformFactory} from '../pipes';

export const file = ({path, serializer, dictionary}: FileConfig) => {
  const transforms: ObjectPipeTransformFactory[] = [serializer];
  if (dictionary) {
    transforms.push(dict());
  }

  return buffer({
    stream: new FileStreamFactory(path, transforms),
    bundle: true
  });
}
