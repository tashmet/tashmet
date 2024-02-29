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
    const writer = this.exprIO.writer;

    const fmRoot: Document[] = [
      { $project: { [body]: 0 } },
      { $project: { frontmatter: writer('$$ROOT') } }
    ];

    const fmField: Document[] = [
      { $project: { frontmatter: writer(`$${field}`) } }
    ]

    return [
      { $replaceWith: '$content' },
      {
        $facet: {
          body: [ { $project: { body: `$${body}` } } ],
          frontmatter: this.config.field ? fmField : fmRoot,
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
