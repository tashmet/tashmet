import { TashmetProxy } from "../interfaces.js";
import { TashmetCollectionNamespace, TashmetNamespace } from "../utils.js";
import { CommandOperation, CommandOperationOptions } from "./command.js";

/** @public */
export type DropCollectionOptions = CommandOperationOptions;

/** @internal */
export class DropCollectionOperation extends CommandOperation<boolean> {

  constructor(namespace: TashmetCollectionNamespace, public options: DropCollectionOptions) {
    super(namespace, options);
  }

  async execute(proxy: TashmetProxy): Promise<boolean> {
    const {ok} = await super.executeCommand(proxy, { drop: this.ns.collection });
    return ok === 1;
  }
}

/** @public */
export type DropDatabaseOptions = CommandOperationOptions;

/** @internal */
export class DropDatabaseOperation extends CommandOperation<boolean> {
  constructor(namespace: TashmetNamespace, public options: DropDatabaseOptions) {
    super(namespace, options);
  }
  async execute(proxy: TashmetProxy): Promise<boolean> {
    const {ok} = await this.executeCommand(proxy, { dropDatabase: 1 });
    return ok === 1;
  }
}
