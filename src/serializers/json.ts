import {Producer} from '@ziggurat/tiamat';
import {Serializer} from '../interfaces';

export function json(): Producer<Serializer> {
  return () => new JsonSerializer();
}

class JsonSerializer implements Serializer {
  public deserialize(buffer: Buffer): Promise<Object> {
    return Promise.resolve(JSON.parse(buffer.toString('utf-8')));
  }

  public serialize(obj: object): Promise<Buffer> {
    return Promise.resolve(Buffer.from(JSON.stringify(obj), 'utf-8'));
  }
}
