import { AggregatorFactory } from '@tashmet/engine';
import { Document } from '@tashmet/tashmet';
import { FileAccess } from "./interfaces.js";


export type GeneratorPipe = (source: AsyncIterable<Document>) => AsyncGenerator<Document>;


export async function toArray<T>(it: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of it) {
    result.push(item);
  }
  return result;
}

export class Stream<T extends Document = Document>
  implements AsyncIterable<T>
{
  [Symbol.asyncIterator](): AsyncIterator<any, void> {
    return {
      next: () => this.source[Symbol.asyncIterator]().next(),
    };
  }

  public constructor(
    protected source: AsyncIterable<T>,
    protected fileAccess: FileAccess,
    protected aggFact: AggregatorFactory,
  ) {}

  public static fromArray<T extends Document = Document>(arr: T[], fileAccess: FileAccess, aggFact: AggregatorFactory): Stream {
    let i=0;

    const it = {
      [Symbol.asyncIterator](): AsyncIterator<T, void> {
        return {
          next: async () => {
            if (i < arr.length) {
              return { value: arr[i++], done: false };
            } else {
              return { value: undefined, done: true };
            }
          }
        };
      }
    }
    return new Stream(it, fileAccess, aggFact);
  }

  public async toArray(): Promise<Document[]> {
    return toArray(this);
  }

  public write(): Promise<any[]> {
    return this.fileAccess.write(this);
  }

  public pipe(pipe: GeneratorPipe | Document[] | Document): Stream<Document> {
    const out = typeof pipe === 'function'
      ? pipe(this.source)
      : this.aggFact.createAggregator(Array.isArray(pipe) ? pipe : [pipe], {}).stream(this.source);

    return new Stream(out, this.fileAccess, this.aggFact);
  }
}
