import ObjectId from 'bson-objectid';
import {CollectionDriver, Database} from './interfaces';
import {Collection} from './collection';
import {ChangeSet} from './changeSet';

/**
 * Abstract base class for databases
 */
export abstract class AbstractDatabase<TDriver extends CollectionDriver<any>> implements Database {
  protected collMap: {[name: string]: Collection} = {};
  protected driverMap: {[name: string]: TDriver} = {};

  public constructor(public readonly databaseName: string) {}

  public collection(name: string): Collection {
    if (name in this.collMap) {
      return this.collMap[name];
    }
    throw Error(`Collection '${name}' does not exist in database`);
  }

  public collections() {
    return Object.values(this.collMap);
  }

  public async dropCollection(name: string) {
    const driver = this.driverMap[name];

    if (!driver) {
      return false;
    }
    await driver.write(ChangeSet.fromDelete(await driver.find({}).toArray()));
    driver.emit('change', {
      _id: new ObjectId(),
      operationType: 'drop',
      ns: driver.ns,
    });
    delete this.collMap[name];
    delete this.driverMap[name];

    return true;
  }
}
