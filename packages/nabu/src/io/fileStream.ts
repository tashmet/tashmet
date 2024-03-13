import { Document } from '@tashmet/tashmet';
import { IOSegment } from '../interfaces.js';
import { Fill } from './fill.js';

export class FileStreamIO implements IOSegment {
  readonly type = 'stream';

  private fill: Fill;

  constructor(
    public path: (id?: string) => string,
    private format: IOSegment,
    private mergeStat: Document = {},
    private assign: Document = {},
    defaults: Document = {},
  ) {
    this.fill = new Fill(defaults);
  }

  get input(): Document[] {
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
      ...this.fill.input,
      { $set: this.assign },
    ];
  }

  get output() {
    const unsetKeys = [...Object.keys(this.assign), ...Object.keys(this.mergeStat)]
      .map(k => `content.${k}`);

    const processOutput: Document[] = [
      {
        $project: {
          _id: '$change.documentKey._id',
          index: 1,
          ordered: 1,
          content: '$change.fullDocument' 
        } 
      },
      { $unset: unsetKeys },
      ...this.fill.output,
      ...this.format.output,
    ]

    return [
      {
        $facet: {
          inserts: [
            { $match: { 'change.operationType': 'insert', valid: true } },
            ...processOutput,
            { $set: { op: 'insert' } },
          ],
          updates: [
            { $match: { 'change.operationType': { $in: ['update', 'replace'] }, valid: true } },
            ...processOutput,
            { $set: { op: 'update' } },
          ],
          deletes: [
            { $match: { 'change.operationType': 'delete' } },
            { $replaceRoot: { newRoot: '$change.documentKey' } },
            { $set: { op: 'delete' } },
          ],
        }
      },
      {
        $project: {
          operations: {
            $concatArrays: [ '$inserts', '$updates', '$deletes' ]
          }
        }
      },
      { $unwind: '$operations' },
      { $replaceRoot: { newRoot: '$operations' } },
      { $sort: { index: 1 } },
      {
        $writeFile: {
          content: '$content',
          to: { $function: { body: this.path, args: [ "$_id" ], lang: "js" }},
          overwrite: { $ne: ['$op', 'insert'] },
          ordered: '$ordered',
          index: '$index',
        }
      }
    ];
  }
}
