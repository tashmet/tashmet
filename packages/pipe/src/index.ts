import {Factory} from '@tashmit/core';
import {Middleware, MiddlewareFactory} from '@tashmit/database';
import {pipeFitting} from './fittings';
import {Pipe, PipeHook, PipeFactory, PipeFittingFactory, PipeFilterHook, PipeConfig} from './interfaces';

export * from './interfaces';

export function pipeMiddleware(fittingFactory: PipeFittingFactory): MiddlewareFactory {
  return Factory.of(async ({collection, database, container}) => {
    const middleware: Required<Middleware> = {events: {}, methods: {}};

    for (const fitting of await fittingFactory.resolve(container)({collection, database})) {
      fitting.attach(middleware, collection);
    }
    return middleware;
  });
}

export interface EachDocumentConfig {
  /** The methods and events to apply the pipe to */
  hooks: PipeHook[];

  /** A pipe or a factory producing a pipe */
  pipe: Pipe | PipeFactory;

  /**
   * Filter successful documents
   *
   * When set to true the pipe will act as a filter, only forwarding documents
   * that were successfully processed. If the pipe resolves with an error the
   * document is skipped and a document-error event is emitted from the collection.
   */
  filter?: boolean | PipeFilterHook[];
}

export const eachDocument = (config: EachDocumentConfig) => {
  const pipes: PipeConfig[] = [];
  for (const hook of config.hooks) {
    const filter = Array.isArray(config.filter)
      ? config.filter.includes(hook as PipeFilterHook)
      : config.filter;

    pipes.push({pipe: config.pipe, hook, filter: filter || false})
  }
  return pipeMiddleware(pipeFitting(pipes));
}

export interface IOGate {
  /** Pipe for processing incoming documents */
  input: Pipe | PipeFactory;

  /** Pipe for processing outgoing documents */
  output: Pipe | PipeFactory;
}

/**
 * Middleware for processing incoming and outgoing documents separately
 *
 * @param gate The gate containg the pipes
 */
export const io = (gate: IOGate) => {
  const inputs: PipeHook[] = ['insertOneIn', 'insertManyIn', 'replaceOneIn'];
  const outputs: PipeHook[] = ['insertOneOut', 'insertManyOut', 'replaceOneOut', 'find', 'findOne', 'document-upserted', 'document-removed'];

  const inPipe = gate.input;
  const outPipe = gate.output;

  const pipes = [
    ...inputs.map(hook => ({pipe: inPipe, hook: hook, filter: false})),
    ...outputs.map(hook => ({pipe: outPipe, hook: hook, filter: false})),
  ]

  return pipeMiddleware(pipeFitting(pipes));
}
