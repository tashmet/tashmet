import { AggregationCursor, ChangeStreamDocument, Document } from '@tashmet/tashmet';
import Nabu from '.';
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
    private nabu: Nabu,
    public readonly inputPipeline: Document[],
    public readonly outputPipeline: Document[],
    private scanPath: ScanPath,
    private lookupPath: (id: string) => string
  ) {}

  public scan(options: ScanOptions = {}): AggregationCursor<Document> {
    const scanPath = typeof this.scanPath === 'string' ? this.scanPath : this.scanPath(options);

    return this.nabu.aggregate([{_id: scanPath}], this.inputPipeline);
  }

  public lookup(documentIds: string[]): AggregationCursor<Document> {
    const input = documentIds.map(id => ({ _id: this.lookupPath(id) }));

    return this.nabu.aggregate(input, this.inputPipeline);
  }

  public write(cs: ChangeStreamDocument[]) {
    return this.nabu.aggregate(cs, this.outputPipeline);
  }
}
