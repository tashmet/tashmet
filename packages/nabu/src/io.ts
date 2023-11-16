import { AggregatorFactory, WriteError, arrayToGenerator } from '@tashmet/engine';
import { ChangeStreamDocument, Document } from '@tashmet/tashmet';
import { ContentRule } from './content';

export interface ScanOptions {
  filter?: Document;
}

export interface IO<TOut> {
  scan(options?: ScanOptions): AsyncIterable<Document>;

  lookup(documentIds: string[]): AsyncIterable<Document>;

  write(output: TOut[]): AsyncIterable<WriteError>;
}

export interface IOFactory<TOut> {
  createIO(aggregatorFactory: AggregatorFactory): IO<TOut>;
}

export type ScanPath = string | ((options: ScanOptions) => string);

export interface IOConfig {
  scan: string | ((options: ScanOptions) => string);

  lookup: (id: string) => string;

  content: ContentRule;
}

export class StreamIO implements IO<ChangeStreamDocument> {
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

export abstract class StreamIOFactory {
  public constructor(protected config: IOConfig) {}

  public abstract createIO(aggregatorFactory: AggregatorFactory): StreamIO;
}
