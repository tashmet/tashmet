import {Injector} from '@ziggurat/tiamat';
import {Serializer, SerializerProvider} from '../interfaces';

export function json(): SerializerProvider {
  return (injector: Injector): Serializer => {
    return new JsonSerializer();
  };
}

class JsonSerializer implements Serializer {
  public deserialize(data: string): Promise<Object> {
    return Promise.resolve(JSON.parse(data));
  }

  public serialize(obj: Object): Promise<string> {
    return Promise.resolve(JSON.stringify(obj));
  }
}
