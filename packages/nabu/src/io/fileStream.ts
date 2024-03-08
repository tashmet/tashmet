import { Document } from '@tashmet/tashmet';
import { IOSegment, StreamIO } from '../interfaces.js';
import { Validator } from '@tashmet/engine';

export class FileStreamIO extends StreamIO {
  public constructor(
    public path: (id?: string) => string,
    private format: IOSegment,
    private mergeStat: Document = {},
    private assign: Document = {},
    private defaults: Document = {},
    private validator: Validator | undefined = undefined,
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

  output() {
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
      { $replaceRoot: { newRoot: '$fullDocument' } },
      { $unset: [...Object.keys(this.assign), ...Object.keys(this.mergeStat)].filter(k => k !== '_id')},
      { $set: defaults },
      { $project: { _id: 1, content: '$$ROOT' } },
      { $unset: 'content._id' },
      ...this.format.output,
    ]

    const pipeline: Document[] = [
      {
        $facet: {
          inserts: [
            { $match: { operationType: 'insert' } },
            ...processOutput,
            { $writeFile: {
              content: '$content',
              to: { $function: { body: this.path, args: [ "$_id" ], lang: "js" }},
              overwrite: false,
            } }
          ],
          updates: [
            { $match: { operationType: { $in: ['update', 'replace'] } } },
            ...processOutput,
            { $writeFile: {
              content: '$content',
              to: { $function: { body: this.path, args: [ "$_id" ], lang: "js" }},
              overwrite: true,
            } }
          ],
          deletes: [
            { $match: { operationType: 'delete' } },
            { $replaceRoot: { newRoot: '$documentKey' } },
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
            $concatArrays: [ '$inserts', '$updates', '$deletes' ]
          }
        }
      },
      { $unwind: '$errors' },
      { $replaceRoot: { newRoot: '$errors' } },
    ];

    return pipeline;
  }
}
