import {Factory} from '@tashmit/core';
import {aggregate, AggregationPipeline} from '@tashmit/database';
import {PipeFactory} from '@tashmit/pipe';

export function aggregationPipe(pipeline: AggregationPipeline): PipeFactory {
  return Factory.of(({database}) =>
    async (doc: any) => (await aggregate<any>(pipeline, [doc], database))[0]
  );
}
