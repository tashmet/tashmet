import { Document } from "@tashmet/tashmet";
import { IORule } from "./content.js";

export interface YamlContentRule {
  frontMatter?: boolean;

  contentKey?: string;
}

export class YamlIORule extends IORule {
  public constructor(private config: YamlContentRule = {}) { super(); }

  protected get reader(): Document {
    return {
      $yamlToObject: {
        frontMatter: this.config.frontMatter === true,
        contentKey: this.config.contentKey,
        path: '$content'
      }
    };
  }

  protected get writer(): Document {
    return {
      $objectToYaml: {
        frontMatter: this.config.frontMatter === true,
        contentKey: this.config.contentKey,
        path: '$content'
      }
    }
  };
}

