
import Tashmet, { AggregationCursor, ChangeStreamDocument, Document } from '@tashmet/tashmet';
import { ContentRule } from './content';

export interface FSConfig {
  scan: string;

  lookup: (id: string) => string;

  content: ContentRule;
}

export class IO {
  public static fs(config: FSConfig): (tashmet: Tashmet) => IO {
    const inputPipeline: Document[] = [
      { $glob: { pattern: '$_id' } },
      {
        $project: {
          _id: 0,
          path: '$_id',
          stats: { $lstat: '$_id' },
          content: { $readFile: '$_id' },
        }
      },
      ...config.content.read,
    ];

    const path = (c: ChangeStreamDocument) => config.lookup(c.documentKey?._id as any);

    const outputPipeline: Document[] = [
      {
        $project: {
          _id: 0,
          content: {
            $cond: {
              if: { $ne: ["$operationType", "delete"] },
              then: "$fullDocument",
              else: { $literal: undefined }
            }
          },
          path: { $function: { body: path, args: [ "$$ROOT" ], lang: "js" }},
          mode: {
            $switch: {
              branches: [
                { case: { $eq: ['$operationType', 'insert'] }, then: 'create' },
                { case: { $eq: ['$operationType', 'replace'] }, then: 'update' },
                { case: { $eq: ['$operationType', 'delete'] }, then: 'delete' },
              ]
            }
          },
        },
      },
      ...config.content.write,
      {
        $writeFile: {
          content: {
            $cond: {
              if: { $ne: ['$mode', 'delete'] },
              then: '$content',
              else: null
            }
          },
          to: '$path',
          overwrite: { $ne: ['$mode', 'create'] },
        }
      }
    ]

    return (tashmet: Tashmet) => new IO(tashmet, inputPipeline, outputPipeline, config.scan, config.lookup);
  }

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
