import { IOSegment } from "../../interfaces.js";

export interface TextConfig {
  contentKey?: string;
}

export class TextFileFormat implements IOSegment {
  readonly type = 'content';
  constructor(private config: TextConfig = {}) {}

  input = [{ $set: { content: {[this.config.contentKey || 'content']: '$content' } } }];
  output = [{ $set: { content: `$content.${this.config.contentKey || 'content'}`} }];
}

