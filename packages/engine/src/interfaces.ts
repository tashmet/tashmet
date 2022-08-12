import ObjectId from 'bson-objectid';
import { EventEmitter } from "eventemitter3";
import { ChangeStreamDocument } from './changeStream';


/** Given an object shaped type, return the type of the _id field or default to ObjectId @public */
export type InferIdType<TSchema> = TSchema extends { _id: infer IdType } // user has defined a type for _id
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {} extends IdType // TODO(NODE-3285): Improve type readability
    ? // eslint-disable-next-line @typescript-eslint/ban-types
      Exclude<IdType, {}>
    : unknown extends IdType
    ? ObjectId
    : IdType
  : ObjectId; // user has not defined _id on schema

export interface CollationOptions {
  readonly locale: string;
  readonly caseLevel?: boolean;
  readonly caseFirst?: string;
  readonly strength?: number;
  readonly numericOrdering?: boolean;
  readonly alternate?: string;
  readonly maxVariable?: string;
  readonly backwards?: boolean;
}

export type Document = Record<string, any>;

export type DatabaseCommandHandler = (command: Document, db: DatabaseEngine) => Promise<Document>;

export interface WriteError {
  errMsg: string;
  index: number;
}

export interface WriteOptions {
  ordered: boolean;
}

export interface StorageEngine {
  readonly databaseName: string;

  create(collection: string, options: Document): Promise<void>;

  drop(collection: string): Promise<void>;

  exists(collection: string, id: string): Promise<boolean>;

  write(changes: ChangeStreamDocument[], options?: WriteOptions): Promise<WriteError[]>;
}

export interface Streamable {
  stream(collection: string): AsyncIterable<Document>;
}

export interface View {
  viewOn: string;
  pipeline: Document[];
}

export interface DatabaseEngine {
  readonly databaseName: string;

  command(command: Document): Promise<Document>;

  on(event: 'change', listener: (change: Document) => void): this;

  emit(event: 'change', change: Document): boolean;
}

export abstract class DatabaseEngineFactory {
  public abstract createDatabaseEngine(dbName: string): DatabaseEngine;
}

export class AbstractDatabaseEngine extends EventEmitter implements DatabaseEngine {
  private commandNames = new Set<string>();

  public constructor(
    public readonly databaseName: string,
    private commands: Record<string, DatabaseCommandHandler> = {}
  ) {
    super();
    this.commandNames = new Set(Object.keys(commands));
  }

  public command(command: Document): Promise<Document> {
    const op = Object.keys(command)[0];
    if (!this.commandNames.has(`$${op}`)) {
      throw new Error(`Command ${op} is not supported`);
    }
    return this.commands[`$${op}`](command, this);
  }
}

export interface AggregatorFactory {
  createAggregator(pipeline: Document[], options: any): AbstractAggregator;
}

export abstract class AbstractAggregator<T extends Document = Document> {
  public constructor(protected pipeline: Document[]) {}

  public abstract stream<TResult>(input: AsyncIterable<T>): AsyncIterable<TResult>;

  public async run<TResult>(input: AsyncIterable<T>): Promise<TResult[]> {
    const buffer = [];
    for await (const item of this.stream(input)) {
      buffer.push(item);
    }
    return buffer as TResult[];
  }
}

export const makeWriteChange = (
  operationType: 'insert' | 'update' | 'replace' | 'delete',
  fullDocument: Document,
  ns: {db: string, coll: string
}) => ({
  _id: new ObjectId(),
  operationType,
  ns,
  documentKey: fullDocument._id,
  fullDocument,
});

export type Validator = (doc: Document) => Promise<Document>;

export abstract class ValidatorFactory {
  public abstract createValidator(rules: Document): Validator;
}
