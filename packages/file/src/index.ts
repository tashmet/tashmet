import {Container, Logger, provider } from '@tashmit/core';
import {Client, Database} from '@tashmit/database';

import {FileAccess} from './interfaces';
import {FileSystemDatabase} from './database';

export * from './interfaces';
export * from './pipeline';
export * from './transform';
export * from './gates';
export * as Pipes from './pipes';


@provider({
  key: FileSystemClient,
  inject: [
    Logger.inScope('file'),
    FileAccess,
  ]
})
export default class FileSystemClient extends Client<Database> {
  public static configure() {
    return (container: Container) => {
      container.register(FileSystemClient);
    }
  }

  public constructor(private logger: Logger, private fileAccess: FileAccess) {
    super();
  }

  db(name: string): FileSystemDatabase {
    return new FileSystemDatabase(name, this.logger, this.fileAccess);
  }
}
