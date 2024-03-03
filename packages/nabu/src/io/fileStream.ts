import { Document } from '@tashmet/tashmet';
import { FileFormat, StreamIO } from '../interfaces.js';

export class FileStreamIO extends StreamIO {
  public constructor(
    public path: (id?: string) => string,
    private format: FileFormat,
    private mergeStat: Document = {},
    private assign: Document = {},
    private defaults: Document = {},
  ) { super(); }

  get input(): Document[] {
    const construct = Object.assign({}, this.assign);
    for (const [k, v] of Object.entries(this.defaults)) {
      construct[k] = {
        $cond: {
          if: { $ne: [{ $type: '$' + k }, 'undefined'] },
          then: '$' + k,
          else: v
        }
      }
    }

    return [
      { $glob: { pattern: '$_id' } },
      {
        $facet: {
          file: [
            {
              $project: {
                _id: 0,
                path: '$_id',
                stats: { $lstat: '$_id' },
              }
            },
          ],
          content: [
            { $project: { _id: 0, content: { $readFile: '$_id' } } },
            ...this.format.reader,
          ]
        }
      },
      { $replaceRoot: { newRoot: { $mergeObjects: [ { $first: '$file' }, { $first: '$content'} ] } } },
      { $replaceRoot: { newRoot: { $mergeObjects: [ this.mergeStat, '$content' ] } } },
      { $set: construct },
    ];
  }

  output(mode: 'insert' | 'update' | 'delete') {
    const pipeline: Document[] = [];

    if (mode !== 'delete') {
      const defaults: Document = {};
      for (const [k, v] of Object.entries(this.defaults)) {
        defaults[k] = {
          $cond: {
            if: { $ne: [v, '$' + k] },
            then: '$' + k,
            else: { $literal: undefined }
          }
        }
      }

      pipeline.push(
        { $unset: [...Object.keys(this.assign), ...Object.keys(this.mergeStat)].filter(k => k !== '_id')},
        { $set: defaults },
        {
          $facet: {
            id: [{ $project: { _id: 1 } }],
            content: [
              { $project: { _id: 0, content: '$$ROOT' } },
              ...this.format.writer,
            ]
          }
        },
        { $replaceWith: { $mergeObjects: [{ $first: '$id' }, { $first: '$content' } ] } }
      );
    }

    return pipeline.concat(
      { $writeFile: {
        content: mode !== 'delete' ? '$content' : null,
        to: { $function: { body: this.path, args: [ "$_id" ], lang: "js" }},
        overwrite: mode !== 'insert',
      } }
    );
  }
}
