import { ChangeStreamDocument, Document } from '@tashmet/tashmet';
import { StreamIO } from '../interfaces.js';


export class FileStreamIO extends StreamIO {
  public constructor(
    public path: (id?: string) => string,
    private reader: (expr: any) => Document,
    private writer: (expr: any) => Document,
    private merge: Document = {},
    private assign: Document = {}
  ) { super(); }

  public get input(): Document[] {
    return [
      { $glob: { pattern: '$_id' } },
      { $project: {
        _id: 0,
        path: '$_id',
        stats: { $lstat: '$_id' },
        content: this.reader({ $readFile: '$_id' }),
      } },
      { $replaceRoot: { newRoot: { $mergeObjects: [ this.merge, '$content' ] } } },
      { $set: this.assign },
    ];
  }

  public get output(): Document[] {
    const path = (c: ChangeStreamDocument) => this.path(c.documentKey?._id as any);

    return [
      { $project: {
        _id: 0,
        content: {
          $cond: {
            if: { $ne: ["$operationType", "delete"] },
            then: "$fullDocument",
            else: { $literal: undefined }
        } },
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
      } },
      { $unset: Object.keys(this.assign) },
      { $set: { content: this.writer('$content') } },
      { $writeFile: {
        content: {
          $cond: {
            if: { $ne: ['$mode', 'delete'] },
            then: '$content',
            else: null
          }
        },
        to: '$path',
        overwrite: { $ne: ['$mode', 'create'] },
      } }
    ]
  }
}
