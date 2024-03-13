import { Document } from "@tashmet/tashmet";
import { IOSegment } from "../interfaces";

export class FileBufferIO implements IOSegment {
  readonly type = 'buffer';

  constructor(private path: string, private format: IOSegment, private field?: string | undefined) {}

  get input(): Document[] {
    const pipeline: Document[] = [
      { $documents: [{ _id: this.path }] },
      { $glob: { pattern: '$_id'} },
      { $project: { content: { $readFile: '$_id' } } },
      ...this.format.input,
    ];

    if (this.field) {
      pipeline.push(
        { $project: { content: this.field ? `$content.${this.field}` : '$content' }},
      );
    }

    return pipeline;
  }

  get output(): Document[] {
    const pipeline: Document[] =  [];

    if (this.field) {
      pipeline.push(
        { $project: {
          content: {
            $cond: {
              if: { $fileExists: this.path },
              then: { $readFile: this.path },
              else: null,
            }
          },
          field: '$content',
        } },
        ...this.format.input,
        { $set: { [`content.${this.field}`]: '$field' } },
        { $unset: 'field' },
      );
    }

    return pipeline.concat([
      ...this.format.output,
      { $writeFile: {
        content: '$content',
        to: this.path,
        overwrite: true
      } }
    ]);
  }
}
