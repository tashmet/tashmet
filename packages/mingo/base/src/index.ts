import { Document } from '@tashmet/tashmet';
import { provider, Provider, Logger } from '@tashmet/core';
import {
  AggregatorFactory,
  AbstractAggregator,
  idSet,
  ChangeSet,
  Comparator,
  ValidatorFactory,
  AggregatorOptions,
  ExpressionOperator,
  PipelineOperator,
  Store,
  HashCode,
  JsonSchemaValidator
} from '@tashmet/engine';
import { hashCode, intersection } from 'mingo/util.js';
import { BufferAggregator } from './aggregator.js';
import { MingoConfig } from './interfaces.js';
import { Query } from 'mingo';
import * as mingo from 'mingo/core.js';
import { Container, Newable, PluginConfigurator } from '@tashmet/core';

export * from './interfaces.js';
export { BufferAggregator, CollectionBuffers } from './aggregator.js';


function makeExpressionOperator(op: ExpressionOperator<any>): mingo.ExpressionOperator  {
  return (obj, expr) => op(expr, ((e: any) => mingo.computeValue(obj, e)));
}

@provider({key: Comparator})
export class MingoComparator implements Comparator {
  public difference<TSchema extends Document>(a: TSchema[], b: TSchema[]): ChangeSet<TSchema> {
    const unchangedIds = idSet(intersection([a, b]));

    return new ChangeSet(
      b.filter(doc => !unchangedIds.has(doc._id)),
      a.filter(doc => !unchangedIds.has(doc._id)),
    );
  }
}

@provider({
  key: AggregatorFactory,
})
export class MingoAggregatorFactory extends AggregatorFactory {
  protected pipelineOps: Record<string, PipelineOperator<any>> = {};

  public constructor(
    protected store: Store,
    protected logger: Logger
  ) { super(); }

  public createAggregator(pipeline: Document[], options: AggregatorOptions): AbstractAggregator<Document> {
    return new BufferAggregator(pipeline, this.store, options, this.logger);
  }

  public addExpressionOperator(name: string, op: ExpressionOperator<any>) {
    mingo.useOperators(mingo.OperatorType.EXPRESSION, {
      [name]: makeExpressionOperator(op),
    });
  }

  public addPipelineOperator(name: string, op: PipelineOperator<any>) {
    this.pipelineOps[name] = op;
  }
}

@provider({
  key: ValidatorFactory,
})
export class FilterValidatorFactory extends ValidatorFactory {
  constructor(private config: MingoConfig) { super(); }

  public createValidator(rules: Document) {
    const query = new Query(rules as any, this.config);

    return (doc: any) => {
      if (query.test(doc)) {
        return doc;
      } else {
        throw new Error('Document failed validation');
      }
    }
  }
}

export class MingoConfigurator extends PluginConfigurator<AggregatorFactory> {
  public constructor(protected app: Newable<AggregatorFactory>, container: Container, protected config: MingoConfig) {
    super(app, container);
  }

  public register() {
    const defaultConfig: MingoConfig = {
      useStrictMode: true,
      scriptEnabled: true,
    };

    this.container.register(Provider.ofInstance(MingoConfig, { ...defaultConfig, ...this.config }));
    this.container.register(Provider.ofInstance(HashCode, hashCode));
    this.container.register(MingoComparator);
    this.container.register(FilterValidatorFactory);
  }

  public load() {
    try {
      const v = this.container.resolve(JsonSchemaValidator);

      this.container.resolve(MingoConfig).jsonSchemaValidator = (s: any) => {
        return (o: any) => v.validate(o, s);
      }
    } catch (err) {
      // do nothing
    }
  }
}

export default (config?: MingoConfig) => (container: Container) =>
  new MingoConfigurator(MingoAggregatorFactory, container, config || {});
