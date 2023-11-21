import { Document, TashmetCollectionNamespace } from '@tashmet/tashmet';
import { provider, Provider, Logger, Optional } from '@tashmet/core';
import {
  AggregatorFactory,
  AbstractAggregator,
  idSet,
  ChangeSet,
  Comparator,
  AggregatorOptions,
  ExpressionOperator,
  PipelineOperator,
  Store,
  HashCode,
  JsonSchemaValidator
} from '@tashmet/engine';
import { hashCode, intersection } from 'mingo/util';
import { BufferAggregator, CollectionBuffer } from './aggregator.js';
import { MingoConfig } from './interfaces.js';
import * as mingo from 'mingo/core';
import { Container, Newable, PluginConfigurator } from '@tashmet/core';
import { MingoValidatorFactory } from './validator.js';
import { makeExpressionOperator } from './operator.js';

export * from './interfaces.js';
export { BufferAggregator } from './aggregator.js';
export { MingoOperatorContext } from './operator.js';

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

  constructor(
    protected store: Store,
    protected logger: Logger,
    protected config: MingoConfig,
    protected validator?: JsonSchemaValidator,
  ) { super(); }

  createAggregator(pipeline: Document[], options: AggregatorOptions = {}): AbstractAggregator<Document> {
    const buffer = new CollectionBuffer(this.store, options.queryAnalysis);

    return new BufferAggregator(pipeline, this.options(buffer, options), buffer, this.logger);
  }

  addExpressionOperator(name: string, op: ExpressionOperator<any>) {
    this.expressionOps[name] = makeExpressionOperator(op);
  }

  addPipelineOperator(name: string, op: PipelineOperator<any>) {
    this.pipelineOps[name] = op;
  }

  protected options(buffer: CollectionBuffer, options: AggregatorOptions) {
    const v = this.validator;
    const context: mingo.Context = mingo.Context.init({
      expression: this.expressionOps
    });

    return mingo.initOptions({
      useStrictMode: this.config.useStrictMode,
      scriptEnabled: this.config.scriptEnabled,
      collation: options.collation,
      context,
      useGlobalContext: true,
      jsonSchemaValidator: v !== undefined
        ? (s: any) => { return (o: any) => v.validate(o, s); }
        : undefined,
      collectionResolver: coll => {
        if (coll.includes('.')) {
          return buffer.get(TashmetCollectionNamespace.fromString(coll));
        }
        if (options.queryAnalysis) {
          return buffer.get(new TashmetCollectionNamespace(options.queryAnalysis.ns.db, coll));
        }
        throw Error('cound not resolve collection');
      }
    });
  }
}

export class MingoConfigurator extends PluginConfigurator<AggregatorFactory> {
  constructor(protected app: Newable<AggregatorFactory>, container: Container, protected config: MingoConfig) {
    super(app, container);
  }

  register() {
    super.register();

    const defaultConfig: MingoConfig = {
      useStrictMode: true,
      scriptEnabled: true,
    };

    this.container.register(Provider.ofInstance(MingoConfig, { ...defaultConfig, ...this.config }));
    this.container.register(Provider.ofInstance(HashCode, hashCode));
    this.container.register(MingoComparator);
    this.container.register(MingoValidatorFactory);
  }
}

export default (config?: MingoConfig) => (container: Container) =>
  new MingoConfigurator(MingoAggregatorFactory, container, config || {});
