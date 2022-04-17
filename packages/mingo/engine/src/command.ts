import { Options as MingoOptions } from 'mingo/core';
import { DatabaseCommandHandler, StorageEngine } from './interfaces';

export abstract class MingoCommandHandler extends DatabaseCommandHandler {
  public constructor(
    protected store: StorageEngine,
    protected options: MingoOptions = {}
  ) { super(); }
}
