import {ClassDecorator, ClassAnnotation} from '@samizdatjs/tiamat';

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
