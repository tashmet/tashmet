import { Container, PluginConfigurator, provider } from '@tashmet/core'
import { AggregatorFactory, op } from '@tashmet/engine'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

@provider()
export class Remark {
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

export class RemarkConfigurator extends PluginConfigurator<Remark> {
  protected load() {
    this.container
      .resolve(AggregatorFactory)
      .addOperatorController(this.container.resolve(Remark));
  }
}

export default () => (container: Container) => new RemarkConfigurator(Remark, container);
