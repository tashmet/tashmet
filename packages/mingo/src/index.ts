import 'mingo/init/system';
import { Document, TashmetCollectionNamespace } from '@tashmet/tashmet';
import {
  AbstractAggregator,
  AggregatorFactory,
  Store,
  AggregatorOptions,
  PipelineOperator,
  ExpressionOperator,
  Comparator,
  idSet,
  ChangeSet,
  HashCode
} from '@tashmet/engine';
import {
  Container,
  Logger,
  Newable,
  PluginConfigurator,
  Provider,
  provider
} from '@tashmet/core';
import jsonSchema from '@tashmet/schema';
import pipelineOperators from './pipeline.js';
import { MingoStreamAggregator } from './aggregator.js';
import { MingoConfig } from './interfaces.js';
import { CollectionBuffer } from './buffer.js';
import * as mingo from 'mingo/core';
import { hashCode, intersection } from 'mingo/util';
import { makeExpressionOperator, makeQueryOperator } from './operator.js';
import { MingoValidatorFactory, validationOperators } from './validator.js';

@provider({key: Comparator})
export class MingoComparator implements Comparator {
  difference<TSchema extends Document>(a: TSchema[], b: TSchema[]): ChangeSet<TSchema> {
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
export class MingoStreamAggregatorFactory extends AggregatorFactory {
  private pipelineOps: Record<string, PipelineOperator<any>> = {};
  private expressionOps: Record<string, mingo.ExpressionOperator> = {};
  private queryOps: Record<string, mingo.QueryOperator> = {};

  constructor(
    private store: Store,
    private logger: Logger,
    private config: MingoConfig,
  ) {
    super();
  }

  public createAggregator(pipeline: Document[], options: AggregatorOptions = {}): AbstractAggregator<Document> {
    const buffer = new CollectionBuffer(this.store, options.plan);
    const mingoOptions = mingo.initOptions({
      useStrictMode: this.config.useStrictMode,
      scriptEnabled: this.config.scriptEnabled,
      collation: options.collation,
      context: mingo.Context.init({
        expression: this.expressionOps,
        query: this.queryOps,
      }),
      useGlobalContext: true,
      variables: options.variables,
      collectionResolver: coll => {
        if (coll.includes('.')) {
          return buffer.get(TashmetCollectionNamespace.fromString(coll));
        }
        if (options.plan) {
          return buffer.get(new TashmetCollectionNamespace(options.plan.ns.db, coll));
        }
        throw Error('cound not resolve collection');
      }
    });

    return new MingoStreamAggregator(pipeline, mingoOptions, buffer, this.logger, this.pipelineOps);
  }

  addExpressionOperator(name: string, op: ExpressionOperator<any>) {
    this.expressionOps[name] = makeExpressionOperator(name, op);
  }

  addQueryOperator(name: string, op: ExpressionOperator<any>) {
    this.queryOps[name] = makeQueryOperator(name, op);
  }

  addPipelineOperator(name: string, op: PipelineOperator<any>) {
    this.pipelineOps[name] = op;
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
  new MingoConfigurator(MingoStreamAggregatorFactory, container, config || {})
    .use(pipelineOperators())
    .use(validationOperators())
    .use(jsonSchema())
