export interface File<T = any> {
  path: string;
  content: T;
  isDir: boolean;
}

export type ReadableFile = File<AsyncGenerator<Buffer> | undefined>;

export interface FileAccess {
  read(path: string | string[]): AsyncGenerator<ReadableFile>;

  //stat(path: string | string[]): AsyncGenerator<File<null>>;

  write(files: AsyncGenerator<File<Buffer>>): Promise<void>;

  remove(files: AsyncGenerator<File>): Promise<void>;
}
