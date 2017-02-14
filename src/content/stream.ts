import {inject, service, Provider, Activator} from '@samizdatjs/tiamat';
import {CollectionController} from './collection';
import {StreamConfig, Serializer, Stream} from './interfaces';

@service({
  name: 'tashmetu.StreamActivator',
  singleton: true
})
export class StreamActivator implements Activator<any> {
  @inject('tiamat.Provider') private provider: Provider;
  private metaData: StreamConfig;

  public activate(obj: any): any {
    this.metaData = this.getMetaData(obj.constructor);
    let collection = this.getCollection();
    collection.setStream(this.createStream(this.createSerializer()));
    return obj;
  }

  private getCollection(): CollectionController {
    return this.provider.get<CollectionController>(this.metaData.target);
  }

  private createStream(serializer: Serializer): Stream<Object> {
    return this.metaData.source.createStream(serializer, this.provider);
  }

  private createSerializer(): Serializer {
    return this.metaData.serializer(this.provider);
  }

  private getMetaData(constructor: any): StreamConfig {
    return Reflect.getOwnMetadata('tashmetu:stream', constructor);
  }
}
