/**
 *
 */
export interface YamlConfig {
  /**
   * Specifies if the YAML in the source files is defined as front matter or not.
   */
  frontMatter?: boolean;

  /**
   * Indentation width to use (in spaces) when serializing. Default is 2.
   */
  indent?: number;
}
