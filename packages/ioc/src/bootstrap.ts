import {Annotation, Newable} from '@ziqquratu/reflection';
import {Container} from './interfaces';
import {BasicContainer} from './container';
import {Provider} from './provider';

export type Bootstrap = (container: Container) => Promise<void>;


/**
 * Bootstrap a component.
 */
export async function bootstrap<T>(
  component: Newable<T>, fn?: Bootstrap): Promise<T>
{
  return bootstrapWithContainer(component, new BasicContainer(), fn);
}

/**
 * Bootstrap a component with a pre-existing container.
 */
export async function bootstrapWithContainer<T>(
  component: Newable<T>, container: Container, fn?: Bootstrap): Promise<T>
{
  container.register(Provider.ofInstance('tiamat.Container', container));
  if (!BootstrapAnnotation.existsOnClass(component)) {
    throw Error('Missing bootstrap annotation on component');
  }
  const annotation = BootstrapAnnotation.onClass(component)[0];
  await annotation.register(container);
  if (fn) {
    await fn(container);
  }
  return annotation.resolve(container);
}

export class BootstrapAnnotation extends Annotation {
  public register<T>(container: Container): Promise<void> {
    throw Error('Bootstrap method not implemented');
  }

  public resolve<T>(container: Container): T {
    throw Error('Bootstrap method not implemented');
  }
}
