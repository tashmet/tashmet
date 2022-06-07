import { Annotation, classDecorator, Newable } from "@tashmet/core";
import { CommandOperation } from "./command";

export const Aspect = {
  READ_OPERATION: Symbol('READ_OPERATION'),
  WRITE_OPERATION: Symbol('WRITE_OPERATION'),
  RETRYABLE: Symbol('RETRYABLE'),
  EXPLAINABLE: Symbol('EXPLAINABLE'),
  SKIP_COLLATION: Symbol('SKIP_COLLATION'),
  CURSOR_CREATING: Symbol('CURSOR_CREATING'),
  CURSOR_ITERATING: Symbol('CURSOR_ITERATING')
} as const;


export class AspectAnnotation extends Annotation {
  public constructor(
    public readonly aspects: Symbol[],
    public readonly target: Newable<CommandOperation<any>>
  ) { super(); }

  public has(aspect: Symbol): boolean {
    return this.aspects.includes(aspect);
  }
}


export const aspects = (...aspects: Symbol[]) =>
  classDecorator(target => new AspectAnnotation(aspects, target));
