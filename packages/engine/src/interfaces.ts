import {
  ChangeStreamDocument,
  CollationOptions,
  Document,
  TashmetCollectionNamespace,
  TashmetNamespace,
  TashmetProxy,
} from '@tashmet/tashmet';
import ev from "eventemitter3";
import { QueryAnalysis } from './aggregation.js';
import { ChangeSet } from './changeSet.js';
import { ExpressionOperator, OperatorAnnotation, PipelineOperator } from './operator.js';

export const { EventEmitter } = ev;

export interface WriteError {
  errMsg: string;
  index: number;
}

export interface WriteOptions {
  ordered: boolean;
}

export interface ReadOptions {
  documentIds?: string[];

  projection?: Document;
}

export interface Readable {
  read(options?: ReadOptions): AsyncIterable<Document>;
}

export interface Writable {
  write(changes: ChangeStreamDocument[], options: WriteOptions): Promise<WriteError[]>;
}

export interface View {
  viewOn: string;
  pipeline: Document[];
}

export type ViewMap = Record<string, View>;

export interface StorageEngine {
  command(ns: TashmetNamespace, command: Document): Promise<Document>;

  on(event: 'change', listener: (change: Document) => void): this;

  client(): TashmetProxy;
}

export class StorageEngine extends EventEmitter implements StorageEngine {
  public proxy(): TashmetProxy {
    return new StorageEngineProxy(this);
  }
}

export class StorageEngineProxy extends TashmetProxy {
  public constructor(private engine: StorageEngine) {
    super();
  }

  public connect() {
    this.engine.on('change', doc => this.emit('change', doc));
    this.emit('connected');
  }

  public command(ns: TashmetNamespace, command: Document): Promise<Document> {
    return this.engine.command(ns, command);
  }
}

export abstract class ReadWriteCollection implements Readable, Writable {
  public constructor(
    public readonly ns: TashmetCollectionNamespace
  ) {}

  public abstract read(options?: ReadOptions): AsyncIterable<Document>;

  public abstract write(changes: ChangeStreamDocument<Document>[], options: WriteOptions): Promise<WriteError[]>;
}

export abstract class CollectionFactory {
  public abstract createCollection(ns: TashmetCollectionNamespace, options: any): ReadWriteCollection;
}

export interface AggregatorOptions {
  queryAnalysis?: QueryAnalysis; 

  collation?: CollationOptions;
}

export interface AggregatorFactory {
  createAggregator(pipeline: Document[], options?: AggregatorOptions): AbstractAggregator;

  addExpressionOperator(name: string, op: ExpressionOperator<any>): void;

  addPipelineOperator(name: string, op: PipelineOperator<any>): void;
}


export abstract class AggregatorFactory implements AggregatorFactory {
  public addOperatorController(controller: any) {
    for (const op of OperatorAnnotation.onClass(controller.constructor, true)) {
      op.register(controller, this);
    }
  }
};

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

export interface Comparator {
  /**
   * Generate a change-set by comparing two collections
   *
   * @param a Collection before changes
   * @param b Collection after changes
   * @returns A change-set
   */
  difference<TSchema extends Document>(a: TSchema[], b: TSchema[]): ChangeSet<TSchema>;
}

export abstract class Comparator implements Comparator {}

export const HashCode = Symbol('HashCode');

export type HashCode = (value: any) => string | null;
