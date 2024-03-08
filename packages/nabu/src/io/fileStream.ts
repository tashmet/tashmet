import { Document } from '@tashmet/tashmet';
import { IOSegment, StreamIO } from '../interfaces.js';

export class FileStreamIO extends StreamIO {
  public constructor(
    public path: (id?: string) => string,
    private format: IOSegment,
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
      { $project: { _id: { $function: { body: this.path, args: [ "$_id" ], lang: "js" } } } },
      { $glob: { pattern: '$_id' } },
      {
        $project: {
          _id: 1,
          path: '$_id',
          stats: { $lstat: '$_id' },
          content: { $readFile: '$_id' },
        }
      },
      ...this.format.input,
      { $replaceRoot: { newRoot: { $mergeObjects: [ this.mergeStat, '$content' ] } } },
      { $set: construct },
    ];
  }

  get output() {
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

    const processOutput: Document[] = [
      { $replaceRoot: { newRoot: '$change.fullDocument' } },
      { $unset: [...Object.keys(this.assign), ...Object.keys(this.mergeStat)].filter(k => k !== '_id')},
      { $set: defaults },
      { $project: { _id: 1, content: '$$ROOT' } },
      { $unset: 'content._id' },
      ...this.format.output,
    ]

    const pipeline: Document[] = [
      {
        $facet: {
          errors: [
            { $match: { error: { $ne: false} } },
            { $replaceRoot: { newRoot: '$error' } },
          ],
          inserts: [
            { $match: { 'change.operationType': 'insert', error: false } },
            ...processOutput,
            { $writeFile: {
              content: '$content',
              to: { $function: { body: this.path, args: [ "$_id" ], lang: "js" }},
              overwrite: false,
            } }
          ],
          updates: [
            { $match: { 'change.operationType': { $in: ['update', 'replace'] }, error: false } },
            ...processOutput,
            { $writeFile: {
              content: '$content',
              to: { $function: { body: this.path, args: [ "$_id" ], lang: "js" }},
              overwrite: true,
            } }
          ],
          deletes: [
            { $match: { 'change.operationType': 'delete' } },
            { $replaceRoot: { newRoot: '$change.documentKey' } },
            { $writeFile: {
              content: null,
              to: { $function: { body: this.path, args: [ "$_id" ], lang: "js" }},
              overwrite: true,
            } }
          ],
        }
      },
      {
        $project: {
          errors: {
            $concatArrays: [ '$errors', '$inserts', '$updates', '$deletes' ]
          }
        }
      },
      { $unwind: '$errors' },
      { $replaceRoot: { newRoot: '$errors' } },
    ];

    return pipeline;
  }
}
