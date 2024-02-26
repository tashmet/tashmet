import { Document } from "@tashmet/tashmet";
import { FileFormat } from "../interfaces.js";

export interface TextConfig {
  /**
   * @default content
   */
  contentKey?: string;
}

export class TextFileFormat implements FileFormat {
  public constructor(private config: TextConfig = {}) {}

  public reader(expr: any): Document {
    return {
      [this.config.contentKey || 'content']: expr
    }
  }

  public writer(expr: any): string {
    return `${expr}.${this.config.contentKey || 'content'}`;
  }
}
