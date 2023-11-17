import { Document } from "@tashmet/tashmet";
import { IORule } from "./content.js";

export interface YamlContentRule {
  frontMatter?: boolean;

  contentKey?: string;
}

export class YamlIORule extends IORule {
  public constructor(private config: YamlContentRule = {}) { super(); }

  protected reader(expr: any): Document {
    return {
      $yamlToObject: {
        frontMatter: this.config.frontMatter === true,
        contentKey: this.config.contentKey,
        path: expr,
      }
    };
  }

  protected writer(expr: any): Document {
    return {
      $objectToYaml: {
        frontMatter: this.config.frontMatter === true,
        contentKey: this.config.contentKey,
        path: expr,
      }
    }
  };
}

