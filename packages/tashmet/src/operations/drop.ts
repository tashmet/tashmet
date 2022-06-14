import { Dispatcher, Namespace } from "../interfaces";
import { CommandOperation, CommandOperationOptions } from "./command";
import { Aspect, aspects } from "./operation";

/** @public */
export type DropCollectionOptions = CommandOperationOptions;

/** @internal */
@aspects(Aspect.WRITE_OPERATION)
export class DropCollectionOperation extends CommandOperation<boolean> {

  constructor(namespace: Namespace, public options: DropCollectionOptions) {
    super(namespace, options);
  }

  async execute(dispatcher: Dispatcher): Promise<boolean> {
    const {ok} = await super.executeCommand(dispatcher, { drop: this.ns.coll });
    return ok === 1;
  }
}

/** @public */
export type DropDatabaseOptions = CommandOperationOptions;

/** @internal */
@aspects(Aspect.WRITE_OPERATION)
export class DropDatabaseOperation extends CommandOperation<boolean> {
  constructor(namespace: Namespace, public options: DropDatabaseOptions) {
    super(namespace, options);
  }
  async execute(dispatcher: Dispatcher): Promise<boolean> {
    const {ok} = await this.executeCommand(dispatcher, { dropDatabase: 1 });
    return ok === 1;
  }
}