import {
  ChangeSet,
} from '@tashmet/tashmet';
import {
  AbstractDatabaseEngine,
  Document,
  StorageEngine,
  makeInsertCommand,
  makeDeleteCommand,
  makeUpdateCommand,
  Streamable,
  makeCreateCommand,
} from '@tashmet/engine';
import { MingoDatabaseEngine } from '@tashmet/mingo-engine';

export class BufferDatabaseEngine extends AbstractDatabaseEngine {
  private locked: boolean = false;

  public constructor(
    public buffer: MingoDatabaseEngine,
    public persistance: StorageEngine & Streamable,
  ) {
    super(buffer.databaseName, {
      $create: makeCreateCommand(persistance, buffer.aggregator),
      $insert: makeInsertCommand(persistance),
      $delete: makeDeleteCommand(persistance, buffer.aggregator),
      $update: makeUpdateCommand(persistance, buffer.aggregator.aggFact),
    });
  }

  public async command(command: Document): Promise<Document> {
    const op = Object.keys(command)[0];

    if (['create', 'drop', 'insert', 'delete', 'update'].includes(op)) {
      return super.command(command);
    } 
    return this.buffer.command(command);
  }
/*
  public async write(cs: ChangeSet<TSchema>) {
    await this.buffer.write(cs);
    try {
      await this.persist(cs);
    } catch (err) {
      await this.buffer.write(cs.toInverse());
      throw err;
    }
  }

  protected abstract persist(cs: ChangeSet<TSchema>): Promise<void>;

  public command(command: Document): Promise<Document> {
    return this.buffer.command(command);
  }
*/
  /*

  public async populate(seed: AsyncGenerator<Document> | undefined) {
    if (seed) {
      return this.buffer.command({insert: ''})
    }
  }
  public async load(cs: ChangeSet<Document>) {
    await this.buffer.write(cs);
    this.emitAll(cs);
  }
  */
}
