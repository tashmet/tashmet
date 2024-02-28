import { FileFormat } from "../interfaces.js";

export interface TextConfig {
  contentKey?: string;
}

export class TextFileFormat implements FileFormat {
  constructor(private config: TextConfig = {}) {}

  reader = [{ $set: { content: {[this.config.contentKey || 'content']: '$content' } } }];
  writer = [{ $set: { content: `$content.${this.config.contentKey || 'content'}`} }];
}

