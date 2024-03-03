import { Container, provider } from '@tashmet/core';
import { op, OperatorContext, OperatorPluginConfigurator } from '@tashmet/engine';

@provider()
export class FrontMatter {
  public constructor() {}

  /**
   * Serialize object to front matter
   */
  @op.expression('$objectToFrontmatter')
  public objectToFrontmatter(obj: any, expr: any, ctx: OperatorContext) {
    const content = ctx.compute(obj, expr) as any;

    let output = '';
    if (content.frontmatter && typeof content.frontmatter === 'string') {
      output += '---\n' + content.frontmatter.trim() + '\n---';
    }

    if (content.body && typeof content.body === 'string') {
      output += '\n' + content.body.replace(/^\s+|\s+$/g, '');
    }

    return output;
  }

  /**
   * Parse front matter to object
   */
  @op.expression('$frontmatterToObject')
  public frontmatterToObject(obj: any, expr: any, ctx: OperatorContext) {
    const content = ctx.compute(obj, expr) as string;

    const re = /^(-{3}(?:\n|\r)([\w\W]+?)(?:\n|\r)-{3})?([\w\W]*)*/;
    const results = re.exec(content);

    const body = (results as any)[3] || '';

    return { frontmatter: (results as any)[2], body: body.trim() }
  }
}

export default () => (container: Container) =>
  new OperatorPluginConfigurator(FrontMatter, container);
