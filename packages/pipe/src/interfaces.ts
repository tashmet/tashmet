import {AsyncFactory} from '@ziqquratu/core';
import {Collection, Database} from '@ziqquratu/database';

export type PipeHook =
  'insertOne' |
  'insertMany' |
  'replaceOne' |
  'find' |
  'findOne' |
  'document-upserted' |
  'document-removed';

export type PipeFilterHook =
  'insertMany' |
  'find' |
  'findOne';

export type Pipe<In = any, Out = In> = (doc: In) => Promise<Out>;

export abstract class PipeFactory extends AsyncFactory<Pipe> {
  public abstract create(source: Collection, database: Database): Promise<Pipe>;
}
