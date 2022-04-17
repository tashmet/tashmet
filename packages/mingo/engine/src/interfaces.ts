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


export abstract class DatabaseCommandHandler {
  public abstract execute(command: Document): Promise<Document>;
}

export interface StorageEngine {
  readonly databaseName: string;

  create(collection: string): Promise<void>;

  drop(collection: string): Promise<void>;

  documents(collection: string): Document[];

  insert(collection: string, document: Document): Promise<void>;

  delete(collection: string, id: string): Promise<void>;

  replace(collection: string, id: string, document: Document): Promise<void>;

  flush(): Promise<void>;
}

export class DatabaseEngine {
  private commandNames = new Set<string>();

  public constructor(
    private commands: Record<string, DatabaseCommandHandler> = {}
  ) {
    this.commandNames = new Set(Object.keys(commands));
  }

  public command(command: Document): Promise<Document> {
    const op = Object.keys(command)[0];
    if (!this.commandNames.has(op)) {
      throw new Error(`Command ${op} is not supported`);
    }
    return this.commands[op].execute(command);
  }
}
