import {aggregate, AggregationPipeline, Collection, Database} from '@ziqquratu/database';
import {Pipe, PipeFactory} from '@ziqquratu/pipe';

export class AggregationPipeFactory extends PipeFactory {
  public constructor(private pipeline: AggregationPipeline = []) {
    super();
  }

  public async create(
    source: Collection, database: Database, appendage: AggregationPipeline = []
  ): Promise<Pipe> {
    return async doc => {
      const result = await aggregate<any>(this.pipeline.concat(appendage), [doc], database);
      return result[0];
    }
  }
}
