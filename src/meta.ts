import {ClassDecorator, ClassAnnotation} from '@samizdatjs/tiamat';

export interface ProviderFor {
  /**
   * The unique identifier that the class provides an instance for.
   * This is used for injecting the class into any component.
   */
  providerFor: string;
}

export class ProviderDecorator extends ClassDecorator<ProviderFor> {
  public constructor(
    protected name: string,
    protected tags?: string[]
  ) {
    super();
  }

  public decorate(data: ProviderFor, target: any) {
    Reflect.defineMetadata('tiamat:provider', {
      for: data.providerFor,
      singleton: true,
      tagged: this.tags || []
    }, target);
    Reflect.defineMetadata(this.name, data, target);
  }
}

export class TaggedClassAnnotation<T> extends ClassAnnotation<T> {
  public constructor(name: string, protected tags: string[]) {
    super(name);
  }

  public decorate(data: T, target: any) {
    super.decorate(data, target);
    this.tags.forEach(tag => {
      this.appendMeta('tiamat:tags', tag, target);
    });
  }
}
