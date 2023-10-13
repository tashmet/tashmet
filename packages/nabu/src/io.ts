import Tashmet, { AggregationCursor, ChangeStreamDocument, Document } from '@tashmet/tashmet';

export class IO {

  public constructor(
    private tashmet: Tashmet,
    public readonly inputPipeline: Document[],
    public readonly outputPipeline: Document[],
    private scanPath: string,
    private lookupPath: (id: string) => string
  ) {}

  public scan(): AggregationCursor<Document> {
    return this.tashmet.aggregate([{_id: this.scanPath}], this.inputPipeline);
  }

  public lookup(documentIds: string[]): AggregationCursor<Document> {
    const input = documentIds.map(id => ({ _id: this.lookupPath(id) }));

    return this.tashmet.aggregate(input, this.inputPipeline);
  }

  public write(cs: ChangeStreamDocument[]) {
    return this.tashmet.aggregate(cs, this.outputPipeline);
  }
}
