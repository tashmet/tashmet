import {Pipe, IOGate} from '@tashmit/pipe';
import {Serializer} from './interfaces';
import * as Pipes from './pipes';

export const dict = (): IOGate<Pipe> => ({
  input: Pipes.toList(),
  output: Pipes.toDict()
});

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
