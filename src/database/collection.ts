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

  public find(filter: Object, options: Object): Promise<any> {
    return this.collection.find(filter, options);
  }

  public findOne(filter: Object, options: Object): Promise<any> {
    return this.collection.findOne(filter, options);
  }

  public upsert(obj: any): Promise<any> {
    return this.collection.upsert(obj);
  }

  public name(): string {
    return this.collection.name();
  }
}
