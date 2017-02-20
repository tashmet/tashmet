import {Provider} from '@samizdatjs/tiamat';
import {Serializer} from '../content';

export interface FileSystem {
  listen(): void;

  readdir(path: string): string[];
  read(path: string): any;
  write(data: string, path: string): void;

  on(event: 'file-added', fn: (path: string) => void): FileSystem;
  on(event: 'file-changed', fn: (path: string) => void): FileSystem;
  on(event: 'file-removed', fn: (path: string) => void): FileSystem;
  on(event: 'file-stored', fn: (data: string, path: string) => void): FileSystem;
  on(event: 'ready', fn: () => void): FileSystem;
}


export interface FileSystemCollectionConfig {
  /**
   * Unique service identifier.
   */
  name: string;

  /**
   * Path to file/directory.
   */
  path: string;

  /**
   * A serializer provider creating a serializer that will parse and serialize
   * documents when reading from and writing to the file system.
   */
  serializer: (provider: Provider) => Serializer;
}

export interface DirectoryConfig extends FileSystemCollectionConfig {
  /**
   * file extension of files in the directory.
   */
  extension: string;
}


export interface FileConfig extends FileSystemCollectionConfig {}
