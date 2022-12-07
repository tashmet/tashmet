import { ContentReaderFunction } from "../interfaces";

export const textReader: ContentReaderFunction = async (content, options) => {
  if (typeof content === 'string') {
    return content;
  }
  if (content instanceof Buffer) {
    return content.toString(options.encoding || 'utf-8');
  }
  throw new Error('Cannot convert content to text');
}
