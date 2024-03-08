import { Document } from "@tashmet/tashmet";
import { IOSegment } from "../interfaces";

export interface FrontmatterConfig {
  format?: string;

  root?: boolean;

  field?: string;

  bodyField?: string
}

export class FrontmatterFileFormat implements IOSegment {
  private format: IOSegment;

  constructor(makeFileFormat: (format: string | Document, field: string) => IOSegment, private config: FrontmatterConfig = {}) {
    this.format = makeFileFormat(config.format || 'text', 'content.frontmatter');
  }

  get input(): Document[] {
    const body = this.config.bodyField || 'body';
    const field = this.config.field || 'frontmatter';
    const reader = this.config.format ? this.format.input : [];
    const merge = this.config.root
      ? '$content.frontmatter'
      : { [field]: '$content.frontmatter' };

    return [
      { $set: { content: { $frontmatterToObject: '$content' } } },
      ...reader,
      { $project: { content: { $mergeObjects: [merge, {[body]: `$content.body`}] } } },
    ];
  }

  get output(): Document[] {
    const body = this.config.bodyField || 'body';
    const field = this.config.field || 'frontmatter';
    const writer = this.config.format ? this.format.output : [];

    const pipeline: Document[] = this.config.root
      ? [
        { $set: { content: { frontmatter: '$content', body: `$content.${body}` } } },
        { $unset: `content.frontmatter.${body}`},
      ]
      : [
        { $set: { content: { frontmatter: `$content.${field}`, body: `$content.${body}` } } },
      ];

    return pipeline.concat([
      ...writer,
      { $set: { content: { $objectToFrontmatter: '$content' } } },
    ]);
  }
}
