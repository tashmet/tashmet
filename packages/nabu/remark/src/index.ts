import { Container, PluginConfigurator } from '@tashmet/core'
import { AggregatorFactory, ExpressionOperator } from '@tashmet/engine'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

export const $markdownToObject: ExpressionOperator<string> = (args, resolve) => {
  return unified()
    .use(remarkParse)
    .parse(resolve(args));
}

export const $markdownToHtml: ExpressionOperator<string> = (args, resolve) => {
  return unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .processSync(resolve(args)).value;
}

export class Remark {
}

export class RemarkConfigurator extends PluginConfigurator<Remark> {
  public load() {
    const aggFact = this.container.resolve(AggregatorFactory);

    aggFact.addExpressionOperator('$markdownToObject', $markdownToObject);
    aggFact.addExpressionOperator('$markdownToHtml', $markdownToHtml);
  }
}

export default () => (container: Container) => new RemarkConfigurator(Remark, container);
