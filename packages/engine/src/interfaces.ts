import { ChangeStreamDocument } from '@tashmet/bridge';
import { Annotation, methodDecorator, Newable } from '@tashmet/core';
import ObjectId from 'bson-objectid';
import ev from "eventemitter3";

export const { EventEmitter } = ev;


export class CommandAnnotation extends Annotation {
  public constructor(
    public readonly name: string,
    public readonly propertyKey: string
  ) { super(); }
}


export const command = (name: string) =>
  methodDecorator(({propertyKey}) => new CommandAnnotation(name, propertyKey));


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

export type DatabaseCommandHandler = (command: Document) => Promise<Document>;

export interface WriteError {
  errMsg: string;
  index: number;
}

export interface WriteOptions {
  ordered: boolean;
}

export interface Streamable {
  stream(collection: string, documentIds?: string[]): AsyncIterable<Document>;
}

export interface Writable {
  write(changes: ChangeStreamDocument[], options: WriteOptions): Promise<WriteError[]>;
}

export interface View {
  viewOn: string;
  pipeline: Document[];
}

export type ViewMap = Record<string, View>;

export interface CollectionRegistry {
  create(name: string, options: Document): Promise<void>;

  drop(name: string): Promise<void>;
}

export interface StorageEngine {
  readonly databaseName: string;

  command(command: Document): Promise<Document>;

  on(event: 'change', listener: (change: Document) => void): this;

  emit(event: 'change', change: Document): boolean;
}

export class StorageEngine extends EventEmitter implements StorageEngine {
  private commandNames = new Set<string>();

  public static fromControllers(databaseName: string, ...controllers: any[]) {
    const commands: Record<string, DatabaseCommandHandler> = {};

    for (const c of controllers) {
      for (const anno of CommandAnnotation.onClass(c.constructor, true)) {
        commands[anno.name] = cmd => c[anno.propertyKey](cmd);
      }
    }

    const engine = new StorageEngine(databaseName, commands);

    for (const c of controllers) {
      if (c instanceof EventEmitter) {
        c.on('change', change => engine.emit('change', change))
      }
    }

    return engine;
  }

  public constructor(
    public readonly databaseName: string,
    private commands: Record<string, DatabaseCommandHandler> = {}
  ) {
    super();
    this.commandNames = new Set(Object.keys(commands));
  }

  public command(command: Document): Promise<Document> {
    const op = StorageEngine.operation(command);
    if (!this.commandNames.has(op)) {
      throw new Error(`Command ${op} is not supported`);
    }
    return this.commands[`${op}`](command);
  }

  public static operation(command: Document): string {
    return Object.keys(command)[0];
  }
}

export abstract class StorageEngineFactory {
  public abstract createStorageEngine(dbName: string): StorageEngine;
}


export interface AggregatorFactory {
  createAggregator(pipeline: Document[], options: any): AbstractAggregator;
}

export abstract class AggregatorFactory implements AggregatorFactory {};

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

export type Validator = (doc: Document) => Promise<Document>;

export abstract class ValidatorFactory {
  public abstract createValidator(rules: Document): Validator;
}

export type CollectionMap<T> = Record<string, T>;
