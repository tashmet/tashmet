import { AggregatorFactory, WriteError } from '@tashmet/engine';
import { arrayToGenerator } from '@tashmet/engine/dist/aggregation';
import { ChangeStreamDocument, Document } from '@tashmet/tashmet';
import { ContentRule } from './content';

export interface ScanOptions {
  filter?: Document;
}

export type ScanPath = string | ((options: ScanOptions) => string);

export interface IOConfig {
  scan: string | ((options: ScanOptions) => string);

  lookup: (id: string) => string;

  content: ContentRule;
}

export class IO {
  public constructor(
    private aggregatorFactory: AggregatorFactory,
    public readonly inputPipeline: Document[],
    public readonly outputPipeline: Document[],
    private scanPath: ScanPath,
    private lookupPath: (id: string) => string
  ) {}

  public scan(options: ScanOptions = {}): AsyncIterable<Document> {
    const scanPath = typeof this.scanPath === 'string' ? this.scanPath : this.scanPath(options);

    return this.aggregate([{ _id: scanPath }], this.inputPipeline);
  }

  public lookup(documentIds: string[]): AsyncIterable<Document> {
    const input = documentIds.map(id => ({ _id: this.lookupPath(id) }));

    return this.aggregate(input, this.inputPipeline);
  }

  public write(cs: ChangeStreamDocument[]) {
    return this.aggregate(cs, this.outputPipeline) as AsyncIterable<WriteError>;
  }

  private aggregate(input: Document[], pipeline: Document[]) {
    return this.aggregatorFactory
      .createAggregator(pipeline, {})
      .stream<Document>(arrayToGenerator(input));
  }
}
