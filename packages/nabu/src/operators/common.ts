import { Document } from '@tashmet/engine';

export function transform(fn: (doc: Document) => Document) {
  return (source: AsyncIterable<Document>) => {
    async function *generator() {
      for await (const doc of source) {
        yield fn(doc);
      }
    } 
    return generator();
  }
}

export function clone() {
  return transform(doc => JSON.parse(JSON.stringify(doc)));
}
