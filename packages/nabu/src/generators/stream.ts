import { Document } from '@tashmet/tashmet';
import { File, FileConfig, ManyFilesInputConfig, ManyFilesOutputConfig } from "../interfaces";
import { StreamAggregator } from './aggregator';
import { DocumentStream, FileStream, Writable } from './interfaces';


export async function toArray<T>(it: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of it) {
    result.push(item);
  }
  return result;
}

export class Stream<T extends Document = Document>
  implements AsyncIterable<T>, FileStream, DocumentStream<T>
{
  [Symbol.asyncIterator](): AsyncIterator<any, void> {
    return {
      next: () => this.source[Symbol.asyncIterator]().next(),
    };
  }

  public constructor(
    protected source: AsyncIterable<T>,
  ) {}

  public static fromArray<T extends Document = Document>(arr: T[]): Stream {
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
    return new Stream(it);
  }

  public async toArray(): Promise<any> {
    return toArray(this);
  }

  public async write(writable: Writable<any>): Promise<void> {
    writable.next();
    for await (const item of this) {
      await writable.next(item);
    }
    writable.return();
  }

  public aggregate<TResult extends Document = Document>(pipeline: Document[]): Stream<TResult> {
    return new Stream<TResult>(new StreamAggregator<TResult>(pipeline).stream(this.source));
  }

  public loadBundle<TSchema extends Document = Document>(
    {serializer, dictionary}: FileConfig<Document>
  ): DocumentStream<TSchema> {
    const unpack: Document[] = dictionary
      ? [
        {$project: { documents: { $objectToArray: "$content" } } },
        {$unwind: "$documents" },
        {$set: { 'documents.v._id': '$documents.k' }},
        {$replaceRoot: {newRoot: '$documents.v'}},
      ] : [
        {$unwind: "$content" },
        {$replaceRoot: {newRoot: '$content'}}
      ];
    return this.aggregate<TSchema>([...serializer.input, ...unpack]);
  }

  public createBundle({path, dictionary, serializer}: FileConfig<T>): FileStream {
    const pipeline: Document[] = dictionary
      ? [
        {$project: {k: '$_id', v: '$$ROOT', 'v._id': 0, group: 'group', _id: 0}},
        {$group: {_id: 'group', content: {$push: {k: '$k', v: '$v'}}}},
        {$project: {_id: 0, path, content: {$arrayToObject: '$content'}}},
        {$set: {isDir: false}},
      ] : [
        {$group: {_id: 1, content: {$push: '$$ROOT'}}},
        {$project: {_id: 0, path, content: 1}},
        {$set: {isDir: false}},
      ];

    if (serializer) {
      pipeline.push(...serializer.output);
    }

    return this.aggregate(pipeline);
  }

  public loadFiles<T extends Document = Document>(
    {serializer, afterParse, id}: ManyFilesInputConfig): DocumentStream<T>
  {
    const pipeline: Document[] = serializer.input;

    if (afterParse) {
      pipeline.push(...afterParse);
    }

    if (typeof id === 'function') {
      id = { $function: { body: id, args: [ "$$ROOT" ], lang: "js" }};
    }

    pipeline.push(
      {$set: { 'content._id': id }},
      {$replaceRoot: {newRoot: '$content'}}
    );
    return this.aggregate(pipeline);
  }

  public createFiles({path, serializer}: ManyFilesOutputConfig): FileStream {
    const pipeline: Document[] = [
      { $project: {
        _id: 0,
        path: { $function: { body: path, args: [ "$$ROOT" ], lang: "js" }},
        content: '$$ROOT'}
      },
      { $set: {isDir: false} },
    ];
    if (serializer) {
      pipeline.push(...serializer.output);
    }
    return this.aggregate<File<Buffer>>(pipeline);
  }
}
