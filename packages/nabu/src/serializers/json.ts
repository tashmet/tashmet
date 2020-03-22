import {Serializer, SerializerFactory} from '../interfaces';

class JsonSerializer implements Serializer {
  public deserialize(buffer: Buffer): Promise<Record<string, any>> {
    return Promise.resolve(JSON.parse(buffer.toString('utf-8')));
  }

  public serialize(obj: object): Promise<Buffer> {
    return Promise.resolve(Buffer.from(JSON.stringify(obj), 'utf-8'));
  }
}

export class JsonSerializerFactory extends SerializerFactory {
  public create(): Serializer {
    return new JsonSerializer();
  }
}

export const json = () => new JsonSerializerFactory();
