import {Duplex, Serializer} from './interfaces';
import * as Pipes from './pipes';

export const dict = () => ({
  input: Pipes.toList(),
  output: Pipes.toDict()
}) as Duplex;

export function json<T>(encoding?: Pipes.JsonEncoding): Serializer<T> {
  return {
    input: Pipes.fromJson(encoding),
    output: Pipes.toJson(encoding)
  }
};

export function yaml<T>(config?: Pipes.YamlConfig): Serializer<T> {
  return {
    input: Pipes.fromYaml(config),
    output: Pipes.toYaml(config)
  }
};
