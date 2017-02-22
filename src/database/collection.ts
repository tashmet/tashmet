import {Collection} from '../interfaces';
import {EventEmitter} from '../util';

export class CollectionBase extends EventEmitter implements Collection {
  protected collection: Collection;

  public setCollection(collection: Collection): void {
    this.collection = collection;

    const events = [
      'document-upserted',
      'document-removed'
    ];
    events.forEach((event: string) => {
      collection.on(event, (obj: any) => {
        this.emit(event, obj);
      });
    });
  }

  public find(filter: Object, options: Object, fn: (result: any) => void): void {
    this.collection.find(filter, options, fn);
  }

  public findOne(filter: Object, options: Object, fn: (result: any) => void): void {
    this.collection.findOne(filter, options, fn);
  }

  public upsert(obj: any, fn: () => void): void {
    this.collection.upsert(obj, fn);
  }

  public name(): string {
    return this.collection.name();
  }
}
