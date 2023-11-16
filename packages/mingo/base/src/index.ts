import { Document } from '@tashmet/tashmet';
import { provider, Provider, Logger, Optional } from '@tashmet/core';
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
import { hashCode, intersection } from 'mingo/util';
import { BufferAggregator } from './aggregator.js';
import { MingoConfig } from './interfaces.js';
import { Query } from 'mingo';
import * as mingo from 'mingo/core';
import { Container, Newable, PluginConfigurator } from '@tashmet/core';

export * from './interfaces.js';
export { BufferAggregator, CollectionBuffers } from './aggregator.js';


function makeExpressionOperator(op: ExpressionOperator<any>): mingo.ExpressionOperator  {
  return (obj, expr, options) => op(expr, ((e: any) => mingo.computeValue(obj, e, null, options)));
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
  inject: [Store, Logger, MingoConfig, Optional.of(JsonSchemaValidator)]
})
export class MingoAggregatorFactory extends AggregatorFactory {
  protected pipelineOps: Record<string, PipelineOperator<any>> = {};
  protected expressionOps: Record<string, mingo.ExpressionOperator> = {};

  public constructor(
    protected store: Store,
    protected logger: Logger,
    protected config: MingoConfig,
    protected validator?: JsonSchemaValidator,
  ) { super(); }

  public createAggregator(pipeline: Document[], options: AggregatorOptions): AbstractAggregator<Document> {
    const context: mingo.Context = mingo.Context.init({
      expression: this.expressionOps
    });

    return new BufferAggregator(pipeline, this.store, options, this.config, context, this.logger, this.validator);
  }

  public addExpressionOperator(name: string, op: ExpressionOperator<any>) {
    this.expressionOps[name] = makeExpressionOperator(op);
  }

  public addPipelineOperator(name: string, op: PipelineOperator<any>) {
    this.pipelineOps[name] = op;
  }
}

@provider({
  key: ValidatorFactory,
  inject: [MingoConfig, Optional.of(JsonSchemaValidator)]
})
export class FilterValidatorFactory extends ValidatorFactory {
  constructor(
    private config: MingoConfig,
    private jsonSchemaValidator?: JsonSchemaValidator,
  ) { super(); }

  public createValidator(rules: Document) {
    const v = this.jsonSchemaValidator;

    const query = new Query(rules as any, {
      ...this.config,
      jsonSchemaValidator: v !== undefined
        ? (s: any) => { return (o: any) => v.validate(o, s); }
        : undefined
    });

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
    super.register();

    const defaultConfig: MingoConfig = {
      useStrictMode: true,
      scriptEnabled: true,
    };

    this.container.register(Provider.ofInstance(MingoConfig, { ...defaultConfig, ...this.config }));
    this.container.register(Provider.ofInstance(HashCode, hashCode));
    this.container.register(MingoComparator);
    this.container.register(FilterValidatorFactory);
  }
}

export default (config?: MingoConfig) => (container: Container) =>
  new MingoConfigurator(MingoAggregatorFactory, container, config || {});
