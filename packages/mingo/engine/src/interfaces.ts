import { CollationOptions } from "@tashmet/tashmet";

export type Document = Record<string, any>;

/**
 * Configuration options for the mingo storage engine.
 */
export interface MingoConfig {
  /**
   * Enforces strict MongoDB compatibilty. See readme for differences. @default true.
   * When disabled, the $elemMatch projection operator returns all matching nested documents instead of only the first.
   */
  readonly useStrictMode?: boolean;

  /**
   * Enables or disables custom script execution.
   * When disabled, you cannot use operations that execute custom code, such as the $where, $accumulator, and $function.
   * @default true
   */
  readonly scriptEnabled?: boolean;
}

export abstract class MingoConfig implements MingoConfig {}


/*
export abstract class DatabaseCommandHandler {
  public abstract execute(command: Document): Promise<Document>;
}
*/
export type DatabaseCommandHandler = (engine: DatabaseEngine, command: Document) => Promise<Document>;

export interface StorageEngine {
  readonly databaseName: string;

  create(collection: string): Promise<void>;

  drop(collection: string): Promise<void>;

  collection(collection: string): AsyncIterable<Document>;
  
  index(collection: string, id: string): number | undefined;

  insert(collection: string, document: Document): Promise<void>;

  delete(collection: string, id: string): Promise<void>;

  replace(collection: string, id: string, document: Document): Promise<void>;

  flush(): Promise<void>;
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

export class DatabaseEngine {
  private commandNames = new Set<string>();
  private cursorCounter = 0;
  private cursors: Record<number, EngineCursor> = {};

  public constructor(
    public readonly store: StorageEngine,
    public readonly aggFact: AggregatorFactory,
    private commands: Record<string, DatabaseCommandHandler> = {}
  ) {
    this.commandNames = new Set(Object.keys(commands));
  }

  public command(command: Document): Promise<Document> {
    const op = Object.keys(command)[0];
    if (!this.commandNames.has(`$${op}`)) {
      throw new Error(`Command ${op} is not supported`);
    }
    return this.commands[`$${op}`](this, command);
  }

  public openCursor(collName: string, pipeline: Document[], collation?: CollationOptions) {
    let coll = this.store.collection(collName);
    const it = this.aggFact
      .createAggregator(pipeline, {collation})
      .stream<Document>(coll);

    const cursor = new EngineCursor(it[Symbol.asyncIterator](), ++this.cursorCounter, this);
    return this.cursors[this.cursorCounter] = cursor;
  }

  public closeCursor(id: number) {
    delete this.cursors[id];
  }

  public getCursor(id: number) {
    return this.cursors[id];
  }
}

export class EngineCursor {
  public constructor(
    public readonly iterator: AsyncIterator<Document>,
    public readonly id: number,
    private engine: DatabaseEngine,
  ) {}

  public next(): Promise<IteratorResult<Document>> {
    return this.iterator.next();
  }

  public async getBatch(
    batchSize: number | undefined = undefined
  ): Promise<Document[]> {

    const batch: Document[] = [];
    let result = await this.next();

    while (!result.done) {
      batch.push(result.value as Document);

      if (!batchSize || (batchSize && batch.length < batchSize)) {
        result = await this.next();
      } else {
        break;
      }
    }
    return batch;
  }

  public toArray(): Promise<Document[]> {
    return this.getBatch();
  }

  public close() {
    return this.engine.closeCursor(this.id);
  }
}