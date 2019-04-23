import {classDecorator, Newable} from '@ziggurat/meta';
import {Container, AbstractProviderAnnotation} from '@ziggurat/tiamat';
import {CollectionConfig, Database} from './interfaces';

export class CollectionAnnotation extends AbstractProviderAnnotation {
  public constructor(
    public config: CollectionConfig,
    public target: Newable<any>
  ) { super(target); }

  public provide(container: Container) {
    container.registerSingletonFactory(this.target, (database: Database) => {
      return database.createCollection(this.target, this.config);
    }, ['isimud.Database']);
  }
}

export const collection = <(config: CollectionConfig) => any>
  classDecorator(CollectionAnnotation, {
    middleware: [],
    indices: ['_id']
  });
