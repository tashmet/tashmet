import { Store } from '@tashmet/bridge';
import { Namespace } from "../interfaces.js";
import { CommandOperation, CommandOperationOptions } from "./command.js";

/** @public */
export type DropCollectionOptions = CommandOperationOptions;

/** @internal */
export class DropCollectionOperation extends CommandOperation<boolean> {

  constructor(namespace: Namespace, public options: DropCollectionOptions) {
    super(namespace, options);
  }

  async execute(store: Store): Promise<boolean> {
    const {ok} = await super.executeCommand(store, { drop: this.ns.coll });
    return ok === 1;
  }
}

/** @public */
export type DropDatabaseOptions = CommandOperationOptions;

/** @internal */
export class DropDatabaseOperation extends CommandOperation<boolean> {
  constructor(namespace: Namespace, public options: DropDatabaseOptions) {
    super(namespace, options);
  }
  async execute(store: Store): Promise<boolean> {
    const {ok} = await this.executeCommand(store, { dropDatabase: 1 });
    return ok === 1;
  }
}
