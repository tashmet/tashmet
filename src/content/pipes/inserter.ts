import {Collection, Pipe} from '../interfaces';

/**
 * Pipe that adds the incoming document to a collection.
 */
export class Inserter implements Pipe {
  private collection: Collection;

  public setCollection(collection: Collection): void {
    this.collection = collection;
  }

  public process(input: any, next: (output: any) => void): void {
    this.collection.upsert(input, () => {
      next(input);
    });
  }
}
