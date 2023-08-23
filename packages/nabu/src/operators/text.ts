import { ContentReaderFunction, ContentWriterFunction } from "../interfaces.js";

export const textReader: ContentReaderFunction = async (content) => {
  if (typeof content === 'string') {
    return content;
  }
  if (content instanceof Buffer) {
    return content.toString('utf-8');
  }
  throw new Error('Cannot convert content to text');
}

export const textWriter: ContentWriterFunction = async (content) => {
  if (typeof content === 'string') {
    return Buffer.from(content, 'utf-8');
  }
  throw new Error('Cannot convert content to text');
}
