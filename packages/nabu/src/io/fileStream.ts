import { Document } from '@tashmet/tashmet';
import { FileFormat, StreamIO } from '../interfaces.js';

export class FileStreamIO extends StreamIO {
  public constructor(
    public path: (id?: string) => string,
    private format: FileFormat,
    private merge: Document = {},
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
      { $project: {
        _id: 0,
        path: '$_id',
        stats: { $lstat: '$_id' },
        content: this.format.reader({ $readFile: '$_id' }),
      } },
      { $replaceRoot: { newRoot: { $mergeObjects: [ this.merge, '$content' ] } } },
      { $set: construct },
    ];
  }

  output(mode: 'insert' | 'update' | 'delete') {
    const path = (c: Document) => this.path((c as any)._id);
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
        { $unset: Object.keys(this.assign) },
        { $set: defaults },
      );
    }

    return pipeline.concat(
      { $writeFile: {
        content: mode !== 'delete' ? this.format.writer('$$ROOT') : null,
        to: { $function: { body: path, args: [ "$$ROOT" ], lang: "js" }},
        overwrite: mode !== 'insert',
      } }
    );
  }
}
