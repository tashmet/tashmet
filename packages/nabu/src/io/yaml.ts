import { ContentRule } from "../content.js";
import { ContentRuleOptions, IORule } from "./content.js";

export interface YamlContentRule extends ContentRuleOptions {
  frontMatter?: boolean;

  contentKey?: string;
}

export class YamlIORule extends IORule<YamlContentRule> {
  public constructor(config: YamlContentRule = {}) { super(config); }

  public directory(path: string, extension: string = '.yaml') {
    return super.directory(path, extension);
  }

  protected contentRule(config: YamlContentRule): ContentRule {
    const def: Required<YamlContentRule> = {
      frontMatter: false,
      contentKey: '_content',
      merge: { _id: '$path' },
      construct: {},
    }
    const { frontMatter, contentKey, merge, construct } = { ...def, ...config };

    const input = frontMatter ? { $yamlfmToObject: '$content' } : { $yamlToObject: '$content' };
    const output = frontMatter ? { $objectToYamlfm: '$content' } : { $objectToYaml: '$content' };

    return ContentRule
      .fromRootReplace(input, output, merge)
      .rename('_content', contentKey)
      .assign(construct);
  }
}

