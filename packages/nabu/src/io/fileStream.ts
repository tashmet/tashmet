import { ChangeStreamDocument, Document } from '@tashmet/tashmet';
import { FileFormat, StreamIO } from '../interfaces.js';
import { makeFileFormat } from '../format/index.js';

export class FileStreamIO extends StreamIO {
  static fromGlob({pattern, format, ...options}: Document) {
    if (typeof pattern !== 'string') {
      throw new Error('Failed create glob IO, pattern is not a string');
    }

    const merge = Object.assign(
      {}, options?.merge, { _id: '$path' }
    );

    return new FileStreamIO(
      id => id ? id : pattern,
      makeFileFormat(format),
      merge,
      options?.construct
    );
  }

  static fromDirectory({path, extension, format, ...options}: Document) {
    if (typeof path !== 'string') {
      throw new Error('Failed create directory IO, path is not a string');
    }

    const merge = Object.assign(
      {}, options?.merge, { _id: { $basename: ['$path', { $extname: '$path' }] } }
    );

    return new FileStreamIO(
      id => id ? `${path}/${id}${extension}` : `${path}/*${extension}`,
      makeFileFormat(format),
      merge,
      options?.construct
    );
  }

  public constructor(
    public path: (id?: string) => string,
    private format: FileFormat,
    private merge: Document = {},
    private assign: Document = {}
  ) { super(); }

  get input(): Document[] {
    return [
      { $glob: { pattern: '$_id' } },
      { $project: {
        _id: 0,
        path: '$_id',
        stats: { $lstat: '$_id' },
        content: this.format.reader({ $readFile: '$_id' }),
      } },
      { $replaceRoot: { newRoot: { $mergeObjects: [ this.merge, '$content' ] } } },
      { $set: this.assign },
    ];
  }

  get output(): Document[] {
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
      { $set: { content: this.format.writer('$content') } },
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
