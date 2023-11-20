/**
 * Configuration options for the YAML serializer.
 *
 * These options, with the exception of 'frontMatter', correspond to the options for js-yaml since
 * that is the library used under the hood. For more information see:
 *
 * http://nodeca.github.com/js-yaml/
 */
export interface YamlOptions {
  /**
   * Indentation width to use (in spaces) when serializing.
   *
   * default: 2
   */
  indent?: number;

  /**
   * Do not throw on invalid types (like function in the safe schema) and skip pairs and single
   * values with such types.
   *
   * default: false
   */
  skipInvalid?: boolean;

  /**
   * Specifies level of nesting, when to switch from block to flow style for collections.
   * -1 means block style everwhere.
   *
   * default: -1
   */
  flowLevel?: number;

  /**
   * "tag" => "style" map. Each tag may have own set of styles.
   */
  styles?: {[tag: string]: string};

  /**
   * If true, sort keys when dumping YAML. If a function, use the function to sort the keys.
   *
   * default: false
   */
  sortKeys?: boolean | ((a: any, b: any) => number);

  /**
   * Set max line width for serialized output.
   *
   * default: 80
   */
  lineWidth?: number;

  /**
   * If true, don't convert duplicate objects into references.
   *
   * default: false
   */
  noRefs?: boolean;

  /**
   * If true don't try to be compatible with older yaml versions. Currently: don't quote "yes",
   * "no" and so on, as required for YAML 1.1
   *
   * default: false
   */
  noCompatMode?: boolean;

  /**
   * If true flow sequences will be condensed, omitting the space between a, b. Eg. '[a,b]',
   * and omitting the space between key: value and quoting the key. Eg. '{"a":b}'.
   * Can be useful when using yaml for pretty URL query params as spaces are %-encoded.
   *
   * default: false
   */
  condenseFlow?: boolean;
}

export abstract class YamlOptions implements YamlOptions {}
