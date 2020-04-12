import {Middleware, MiddlewareFactory, Collection, Database} from '@ziqquratu/database';
import {Pipe, PipeHook, PipeFactory, PipeFilterHook} from './interfaces';
import {PipeFittingFactory} from './fittings';

export * from './interfaces';

export class PipeMiddlewareFactory extends MiddlewareFactory {
  public constructor(
    private fittings: PipeFittingFactory[]
  ) { super(); }

  public async create(source: Collection, database: Database): Promise<Middleware> {
    const middleware: Required<Middleware> = {events: {}, methods: {}};

    for (const fact of this.fittings) {
      const fitting = await fact.create(source, database);
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
  const fittings: PipeFittingFactory[] = [];
  for (const hook of config.hooks) {
    const filter = Array.isArray(config.filter)
      ? config.filter.includes(hook as PipeFilterHook)
      : config.filter;

    fittings.push(new PipeFittingFactory(config.pipe, hook, filter))
  }
  return new PipeMiddlewareFactory(fittings);
}

export interface IOGate {
  /** Pipe for processing incoming documents */
  input: Pipe;

  /** Pipe for processing outgoing documents */
  output: Pipe;
}

/**
 * Middleware for processing incoming and outgoing documents separately
 * 
 * @param gate The gate containg the pipes
 */
export const io = (gate: IOGate) => {
  const inputs: PipeHook[] = ['insertOne', 'insertMany', 'replaceOne'];
  const outputs: PipeHook[] = ['find', 'findOne', 'document-upserted', 'document-removed'];

  return new PipeMiddlewareFactory([
    ...inputs.map(hook => new PipeFittingFactory(gate.input.bind(gate), hook)),
    ...outputs.map(hook => new PipeFittingFactory(gate.output.bind(gate), hook)),
  ]);
}
