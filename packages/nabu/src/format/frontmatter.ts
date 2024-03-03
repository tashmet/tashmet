import { Document } from "@tashmet/tashmet";
import { FileFormat } from "../interfaces";

export interface FrontmatterConfig {
  format?: string;

  root?: boolean;

  field?: string;

  bodyField?: string
}

export class FrontmatterFileFormat implements FileFormat {
  private format: FileFormat;

  constructor(makeFileFormat: (format: string | Document) => FileFormat, private config: FrontmatterConfig = {}) {
    this.format = makeFileFormat(config.format || 'text');
  }

  get reader(): Document[] {
    const body = this.config.bodyField || 'body';
    const field = this.config.field || 'frontmatter';
    const reader = this.config.format ? this.format.reader : [];

    const pipeline: Document[] = [
      { $replaceRoot: { newRoot: { $frontmatterToObject: '$content' } } },
      {
        $facet: {
          frontmatter: [
            { $project: { content: '$frontmatter' } },
            ...reader,
            { $project: { [field]: '$content' } },
          ],
          body: [
            { $project: { [body]: '$body' } },
          ],
        }
      },
      { $project: { content: { $mergeObjects: [ { $first: '$body' }, { $first: '$frontmatter' } ] } } },
    ];

    if (this.config.root) {
      pipeline.push({
        $set: { content: { $mergeObjects: [`$content.${field}`, {[body]: `$content.${body}`}] } }
      });
    }

    return pipeline;
  }

  get writer(): Document[] {
    const body = this.config.bodyField || 'body';
    const field = this.config.field || 'frontmatter';
    const writer = this.config.format ? this.format.writer : [];

    const fmRoot: Document[] = [
      { $project: { [body]: 0 } },
      { $project: { content: '$$ROOT' } },
      ...writer,
      { $project: { frontmatter: '$content' } }
    ];

    const fmField: Document[] = [
      { $project: { content: `$${field}` } },
      ...writer,
      { $project: { frontmatter: '$content' } }
    ]

    return [
      { $replaceWith: '$content' },
      {
        $facet: {
          body: [ { $project: { body: `$${body}` } } ],
          frontmatter: this.config.root ? fmRoot : fmField
        }
      },
      {
        $project: {
          content: {
            $objectToFrontmatter: {
              $mergeObjects: [ {$first: '$body'}, {$first: '$frontmatter'} ]
            }
          },
        }
      },
    ];
  }
}
