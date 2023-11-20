import { Container, Provider, provider } from '@tashmet/core';
import { op, OperatorContext, OperatorPluginConfigurator } from '@tashmet/engine';
import rehypeSanitize from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import rehypeDocument from 'rehype-document';
import rehypeFormat from 'rehype-format';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import {unified} from 'unified';

export interface MarkdownOptions {

}

export abstract class MarkdownOptions implements MarkdownOptions {}


@provider()
export class Markdown {
  public constructor(public options: MarkdownOptions) {}

  @op.expression('$markdownToObject')
  public markdownToObject(obj: any, expr: string, ctx: OperatorContext) {
    return unified()
      .use(remarkParse)
      .parse(ctx.compute(obj, expr));
  }

  @op.expression('$markdownToHtml')
  public markdownToHtml(obj: any, expr: string, ctx: OperatorContext) {
    return unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeDocument)
      .use(rehypeFormat)
      .use(rehypeSanitize)
      // @ts-ignore
      .use(rehypeStringify)
      .processSync(ctx.compute(obj, expr)).value;
  }
}

export default (options: MarkdownOptions = {}) => (container: Container) =>
  new OperatorPluginConfigurator(Markdown, container)
    .provide(Provider.ofInstance(MarkdownOptions, options));
