import ObjectId from 'bson-objectid';
import { EventEmitter } from "eventemitter3";

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

export interface StorageEngine {
  readonly databaseName: string;

  create(collection: string): Promise<void>;

  drop(collection: string): Promise<void>;

  exists(collection: string, id: string): Promise<boolean>;

  insert(collection: string, document: Document): Promise<void>;

  delete(collection: string, id: string): Promise<void>;

  replace(collection: string, id: string, document: Document): Promise<void>;
}

export interface Streamable {
  stream(collection: string): AsyncIterable<Document>;
}

export interface View {
  viewOn: string;
  pipeline: Document[];
}

export class DatabaseEngine extends EventEmitter {
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
