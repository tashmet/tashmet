import {ClassMetaWriter} from '@samizdatjs/tiamat';

export interface ProviderFor {
  /**
   * The unique identifier that the class provides an instance for.
   * This is used for injecting the class into any component.
   */
  providerFor: string;
}

export class ProviderMetaWriter extends ClassMetaWriter<ProviderFor> {
  public constructor(
    protected name: string,
    protected tags?: string[]
  ) {
    super();
  }

  public write(data: ProviderFor, target: any) {
    Reflect.defineMetadata('tiamat:provider', {
      for: data.providerFor,
      singleton: true,
      tagged: this.tags || []
    }, target);
    Reflect.defineMetadata(this.name, data, target);
  }
}
