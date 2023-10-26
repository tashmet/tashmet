import { Container, Provider, provider } from '@tashmet/core'
import { op, OperatorPluginConfigurator } from '@tashmet/engine'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

export interface MarkdownOptions {

}

export abstract class MarkdownOptions implements MarkdownOptions {};


@provider()
export class Markdown {
  public constructor(public options: MarkdownOptions) {}

  @op.expression('$markdownToObject')
  public markdownToObject(expr: string, resolve: (expr: any) => any) {
    return unified()
      .use(remarkParse)
      .parse(resolve(expr));
  }

  @op.expression('$markdownToHtml')
  public markdownToHtml(expr: string, resolve: (expr: any) => any) {
    return unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(rehypeSanitize)
      .use(rehypeStringify)
      .processSync(resolve(expr)).value;
  }
}

export default (options: MarkdownOptions = {}) => (container: Container) =>
  new OperatorPluginConfigurator(Markdown, container)
    .provide(Provider.ofInstance(MarkdownOptions, options));
