import * as stream from 'stream';

/** A factory for creating a duplex or transform stream */
export interface StreamFactory {
  /** Create a readable stream */
  createReadable(...args: any[]): stream.Readable;

  /** Create a writable stream */
  createWritable(...args: any[]): stream.Writable;
}

/** A factory for creating a duplex transform stream */
export interface DuplexTransformFactory {
  /**
   * Create stream for transforming input
   * 
   * @param key When set the transform will only process the content of this key
   */
  createInput(key?: string): stream.Transform;

  /**
   * Create stream for transforming output
   * 
   * @param key When set the transform will only process the content of this key
   */
  createOutput(key?: string): stream.Transform;
}

export interface FileSystemConfig {
  /**
   * Monitor file system for changes to files and update sources accordingly.
   *
   * @default false
   */
  watch: boolean;
}

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