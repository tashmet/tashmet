import {AggregationPipeline, Collection, Database} from '@ziqquratu/database';
import {Pipe, PipeFactory} from '@ziqquratu/pipe';
import mingo from 'mingo';

export class AggregationPipeFactory extends PipeFactory {
  public constructor(private pipeline: AggregationPipeline = []) {
    super();
  }

  public async create(
    source: Collection, database: Database, appendage: AggregationPipeline = []
  ): Promise<Pipe> {
    return async doc => mingo.aggregate([doc], this.pipeline.concat(appendage))[0];
  }
}
