import {Factory} from '@tashmit/core';
import {Collection, Middleware, MiddlewareContext} from '@tashmit/database';

export type PipeHook =
  'insertOneIn' |
  'insertOneOut' |
  'insertManyIn' |
  'insertManyOut' |
  'replaceOneIn' |
  'replaceOneOut' |
  'find' |
  'findOne' |
  'document-upserted' |
  'document-removed';

export type PipeFilterHook =
  'insertMany' |
  'find' |
  'findOne';

export type Pipe<In = any, Out = In> = (doc: In) => Promise<Out>;

export type PipeFactory = Factory<Pipe, MiddlewareContext>;

export abstract class PipeFitting {
  public abstract attach(middleware: Required<Middleware>, source: Collection): void;
}

export type PipeFittingFactory = Factory<PipeFitting[], MiddlewareContext>;

export interface PipeConfig {
  hook: PipeHook;
  pipe: Pipe | PipeFactory;
  filter: boolean;
}

export const identityPipe: Pipe = async (doc: any) => doc;
