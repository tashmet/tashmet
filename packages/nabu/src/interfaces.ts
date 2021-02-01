import {DuplexTransformFactory} from './pipes';

export interface DirectoryConfig {
  /**
   * Path to directory.
   */
  path: string;

  /**
   * A serializer factory creating a serializer that will parse and serialize
   * documents when reading from and writing to the file system.
   */
  serializer: DuplexTransformFactory;

  /**
   * file extension of files in the directory.
   */
  extension: string;

  /**
   * When set to true the directory will be created if it does not exist.
   * (false by default).
   */
  create?: boolean;
}

export interface FileConfig {
  /**
   * Path to file.
   */
  path: string;

  /**
   * A serializer factory creating a serializer that will parse and serialize
   * documents when reading from and writing to the file system.
   */
  serializer: DuplexTransformFactory;

  dictionary: boolean;
}

export interface FileSystemConfig {
  /**
   * Monitor file system for changes to files and update sources accordingly.
   *
   * @default false
   */
  watch: boolean;
}
