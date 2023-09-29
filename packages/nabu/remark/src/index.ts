import { BootstrapConfig, Container, plugin, PluginConfigurator } from '@tashmet/core'
import { AggregatorFactory, ExpressionOperator } from '@tashmet/engine'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import {unified} from 'unified'

export const $remarkParse: ExpressionOperator<string> = (args, resolve) => {
  return unified()
    .use(remarkParse)
    .parse(resolve(args));
}

export const $remarkProcess: ExpressionOperator<string> = (args, resolve) => {
  return unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .processSync(resolve(args)).value;
}

@plugin<any>()
export default class NabuRemark {
  public static configure(config: Partial<BootstrapConfig>, container?: Container) {
    return new RemarkConfigurator(NabuRemark, config, container);
  }
}

export class RemarkConfigurator extends PluginConfigurator<NabuRemark, any> {
  public load() {
    const aggFact = this.container.resolve(AggregatorFactory);

    aggFact.addExpressionOperator('$remarkParse', $remarkParse);
    aggFact.addExpressionOperator('$remarkProcess', $remarkProcess);
  }
}
