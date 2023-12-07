import { Document } from "@tashmet/tashmet";
import { FileFormat } from "./content.js";

export interface YamlConfig {
  /**
   * If true, files contain the yaml as front matter
   */
  frontMatter?: boolean;

  /**
   * When frontMatter is true an optional field can be specified where the rest
   * of the file content should be stored.
   * 
   * @default _content
   */
  contentKey?: string;
}

export class YamlFileFormat implements FileFormat {
  public constructor(private config: YamlConfig = {}) {}

  public reader(expr: any): Document {
    return {
      $yamlToObject: {
        frontMatter: this.config.frontMatter === true,
        contentKey: this.config.contentKey,
        path: expr,
      }
    }
  }

  public writer(expr: any): Document {
    return {
      $objectToYaml: {
        frontMatter: this.config.frontMatter === true,
        contentKey: this.config.contentKey,
        path: expr,
      }
    }
  }
}

