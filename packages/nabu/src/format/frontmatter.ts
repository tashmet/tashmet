import { Document } from "@tashmet/tashmet";
import { FileFormat } from "../interfaces";
import { ExpressionIO } from "./common";

export interface FrontmatterConfig {
  field?: string | undefined;

  body?: string | undefined;
}

export class FrontmatterFileFormat implements FileFormat {
  constructor(private exprIO: ExpressionIO, private config: FrontmatterConfig = {}) {}

  get reader(): Document[] {
    const body = this.config.body || 'body';
    const field = this.config.field || 'frontmatter';
    const reader = this.exprIO.reader('$content.frontmatter');

    const contentExpr = this.config.field === undefined
      ? { $mergeObjects: [reader, { [body]: '$content.body'} ] }
      : { [field]: reader, [body]: '$content.body' };

    return [
      { $set: { content: { $frontmatterToObject: '$content' } } },
      { $set: { content: contentExpr } },
    ];
  }

  get writer(): Document[] {
    const body = this.config.body || 'body';
    const field = this.config.field || 'frontmatter';
    const writer = this.exprIO.writer('$content.frontmatter');

    const pipeline: Document[] = [
      {
        $set: {
          content: {
            $mergeObjects: [
              { frontMatter: this.config.field ? `$content.${field}` : '$content' },
              { body: `$content.${body}` }
            ]
          }
        }
      },
    ];

    if (this.config.field === undefined) {
      pipeline.push(
        { $unset: `content.frontmatter.${body}`},
      );
    }

    return pipeline.concat([
      { $set: { 'content.frontmatter': writer } },
      { $set: { content: { $objectToFrontmatter: '$content' } }},
    ]);
  }
}