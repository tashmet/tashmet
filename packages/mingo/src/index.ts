import {
  Document,
  HashCode,
  provider,
  Provider,
  Logger,
} from '@tashmet/tashmet';
import { idSet, ChangeSet, Comparator, Dispatcher } from '@tashmet/bridge';
import { AggregatorFactory, AbstractAggregator, ValidatorFactory, DocumentAccess, AggregatorOptions, ExpressionOperator, PipelineOperator, StorageEngineBridge, AggregationEngine, QueryPlanner, ViewMap, StorageEngine, AggregationReadController } from '@tashmet/engine';
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

//function makePipelineOperator(op: PipelineOperator<any>): mingo.PipelineOperator  {
  //return (coll, expr) => op(coll, ((e: any) => mingo.computeValue(obj, e)));
//}

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
    protected documentAccess: DocumentAccess,
    protected logger: Logger
  ) { super(); }

  public createAggregator(pipeline: Document[], options: AggregatorOptions): AbstractAggregator<Document> {
    return new BufferAggregator(pipeline, this.documentAccess, options, this.logger);
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
  public createValidator(rules: Document) {
    const query = new Query(rules as any);

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
    const fact = this.container.resolve(AggregatorFactory);
    const documentAccess = this.container.resolve(DocumentAccess);
    const logger = this.container.resolve(Logger);
    fact.addOperatorController(fact);

    const engine = new AggregationEngine(
      fact, new QueryPlanner(documentAccess, logger.inScope('QueryPlanner')), '__tashmet');
    const views: ViewMap = {};
    const storageEngine = StorageEngine.fromControllers('__tashmet',
      new AggregationReadController('__tashmet', engine, views),
    );
    this.container.resolve(Dispatcher).addBridge('__tashmet', new StorageEngineBridge(() => storageEngine));
  }
}

export default (config?: MingoConfig) => (container: Container) =>
  new MingoConfigurator(MingoAggregatorFactory, container, config || {});
