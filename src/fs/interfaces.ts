export interface FileSystem {
  listen(): void;

  read(path: string): any;
  write(data: string, path: string): void;

  on(event: 'file-added', fn: (path: string) => void): FileSystem;
  on(event: 'file-changed', fn: (path: string) => void): FileSystem;
  on(event: 'file-removed', fn: (path: string) => void): FileSystem;
  on(event: 'file-stored', fn: (data: string, path: string) => void): FileSystem;
  on(event: 'ready', fn: () => void): FileSystem;
}


export interface DirectoryConfig {
  /**
   * Name of the directory.
   */
  name: string;

  /**
   * file extension of files in the directory.
   */
  extension: string;
}


export interface FileConfig {
  /**
   * Name of the file.
   */
  name: string;
}
