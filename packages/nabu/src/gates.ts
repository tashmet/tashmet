import {Pipe, IOGate} from '@ziqquratu/pipe';
import * as Pipes from './pipes';
import {JsonEncoding} from './pipes/json';
import {YamlConfig} from './pipes/yaml';

export const dict = (): IOGate<Pipe> => ({
  input: Pipes.toList(),
  output: Pipes.toDict()
});

export const json = (encoding?: JsonEncoding): IOGate<Pipe> => ({
  input: Pipes.fromJson(encoding),
  output: Pipes.toJson(encoding)
});

export const yaml = (config?: YamlConfig): IOGate<Pipe> => ({
  input: Pipes.fromYaml(config),
  output: Pipes.toYaml(config)
});
