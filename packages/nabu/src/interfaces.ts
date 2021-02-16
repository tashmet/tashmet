
export interface DirectoryConfig {
  /**
   * Path to directory.
   */
  path: string;

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