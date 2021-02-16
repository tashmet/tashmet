import {Middleware, MiddlewareFactory, Collection, Database} from '@ziqquratu/database';
import {Pipe, PipeHook, PipeFactory, PipeFilterHook, PipeConfig} from './interfaces';
import {PipeFittingFactory} from './fittings';

export * from './interfaces';

export class PipeMiddlewareFactory extends MiddlewareFactory {
  public constructor(
    private fittingFactory: PipeFittingFactory
  ) { super(); }

  public async create(source: Collection, database: Database): Promise<Middleware> {
    const middleware: Required<Middleware> = {events: {}, methods: {}};

    for (const fitting of await this.fittingFactory.create(source, database)) {
      fitting.attach(middleware, source);
    }
    return middleware;
  }
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
  return new PipeMiddlewareFactory(new PipeFittingFactory(pipes));
}

export interface IOGate<T = Pipe | PipeFactory> {
  /** Pipe for processing incoming documents */
  input: T;

  /** Pipe for processing outgoing documents */
  output: T;
}

/**
 * Middleware for processing incoming and outgoing documents separately
 * 
 * @param gate The gate containg the pipes
 */
export const io = (gate: IOGate) => {
  const inputs: PipeHook[] = ['insertOneIn', 'insertManyIn', 'replaceOneIn'];
  const outputs: PipeHook[] = ['insertOneOut', 'insertManyOut', 'replaceOneOut', 'find', 'findOne', 'document-upserted', 'document-removed'];

  const inPipe = gate.input instanceof PipeFactory ? gate.input : gate.input.bind(gate);
  const outPipe = gate.output instanceof PipeFactory ? gate.output : gate.output.bind(gate);

  const pipes = [
    ...inputs.map(hook => ({pipe: inPipe, hook: hook, filter: false})),
    ...outputs.map(hook => ({pipe: outPipe, hook: hook, filter: false})),
  ]

  return new PipeMiddlewareFactory(new PipeFittingFactory(pipes));
}
