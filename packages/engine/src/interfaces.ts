import {
  ChangeStreamDocument,
  CollationOptions,
  Document,
  TashmetCollectionNamespace,
  TashmetNamespace,
  TashmetProxy,
} from '@tashmet/tashmet';
import ev from "eventemitter3";
import { QueryPlan } from './plan.js';
import { ChangeSet } from './changeSet.js';
import { ExpressionOperator, OperatorAnnotation, PipelineOperator, QueryOperator } from './operator.js';
import { Logger } from '@tashmet/core';

export const { EventEmitter } = ev;


/**
 * Read options that allow for optimization when scanning a collection
 *
 * Even though an option has been provided, the readable is not required to act
 * on it, but it rather serves as a hint.
 */
export interface ReadOptions {
  /**
   * Option to restrict the documents read to a list of specified ID's
   *
   * If this is not defined the whold collection is read.
   */
  documentIds?: string[];

  /**
   * Option to project only a subset of fields on each document.
   */
  projection?: Document;
}

/**
 * A readable
 */
export interface Readable {
  /**
   * Read a stream of documents.
   *
   * @param options Optimization options
   */
  read(options?: ReadOptions): AsyncIterable<Document>;
}

export interface WriteOptions {
  /**
   * If set the write should fail on first error and not continue with remaining changes.
   */
  ordered?: boolean;

  /** Bypass validation of documents */
  bypassDocumentValidation?: boolean;
}

export interface WriteError {
  /** Error message */
  errMsg: string;

  errInfo?: Document;

  /** Index of document that failed */
  index: number;
}

/** A writable */
export interface Writable {

  /**
   * Write a list of changes.
   *
   * @param changes A list of change stream documents
   * @param options
   */
  write(changes: ChangeStreamDocument[], options?: WriteOptions): Promise<WriteError[]>;
}

export interface View {
  viewOn: string;
  pipeline: Document[];
}

export type ViewMap = Record<string, View>;

export interface StorageEngine {
  readonly logger: Logger;

  command(ns: TashmetNamespace, command: Document): Promise<Document>;

  on(event: 'change', listener: (change: Document) => void): this;

  proxy(): TashmetProxy;
}

export class StorageEngine extends EventEmitter<any> implements StorageEngine {
  proxy(): TashmetProxy {
    return new StorageEngineProxy(this);
  }
}

export class StorageEngineProxy extends TashmetProxy {
  constructor(private engine: StorageEngine) {
    super();
  }

  connect() {
    this.engine.on('change', doc => this.emit('change', doc));
    this.emit('connected');
  }

  command(ns: TashmetNamespace, command: Document): Promise<Document> {
    return this.engine.command(ns, command);
  }
}

export abstract class ReadWriteCollection implements Readable, Writable {
  constructor(
    public readonly ns: TashmetCollectionNamespace
  ) {}

  abstract read(options?: ReadOptions): AsyncIterable<Document>;

  abstract write(changes: ChangeStreamDocument<Document>[], options: WriteOptions): Promise<WriteError[]>;
}

export abstract class CollectionFactory {
  abstract createCollection(ns: TashmetCollectionNamespace, options: any): ReadWriteCollection;
}

export interface AggregatorOptions {
  plan?: QueryPlan; 

  collation?: CollationOptions;

  variables?: Document
}

export interface AggregatorFactory {
  createAggregator(pipeline: Document[], options?: AggregatorOptions): AbstractAggregator;

  addExpressionOperator(name: string, op: ExpressionOperator<any>): void;

  addPipelineOperator(name: string, op: PipelineOperator<any>): void;

  addQueryOperator(name: string, op: QueryOperator<any>): void;
}


export abstract class AggregatorFactory implements AggregatorFactory {
  addOperatorController(controller: any) {
    for (const op of OperatorAnnotation.onClass(controller.constructor, true)) {
      op.register(controller, this);
    }
  }
}

export async function *arrayToGenerator<T>(array: T[]) {
  for (const item of array) {
    yield item;
  }
}

export abstract class AbstractAggregator<T extends Document = Document> {
  constructor(protected pipeline: Document[]) {}

  abstract stream<TResult>(input: AsyncIterable<T>): AsyncIterable<TResult>;

  async run<TResult>(input: AsyncIterable<T> | T[]): Promise<TResult[]> {
    const buffer = [];
    for await (const item of this.stream(Array.isArray(input) ? arrayToGenerator(input) : input)) {
      buffer.push(item);
    }
    return buffer as TResult[];
  }
}

export type Validator = (doc: Document) => Promise<Document>;

export abstract class ValidatorFactory {
  abstract createValidator(rules: Document): Validator;
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

export class StorageEngineError extends Error {
  constructor(message: string, public info: Document) {
    super(message);
  }
}

export class ValidationError extends StorageEngineError {
  constructor(info: Document) {
    super('Document failed validation', info);
  }
}
