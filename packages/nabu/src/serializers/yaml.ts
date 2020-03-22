import {Converter, ConverterFactory, Serializer, SerializerFactory} from '../interfaces';
import {merge, omit} from 'lodash';

import jsYaml = require('js-yaml');
const yamlFront = require('yaml-front-matter');

/**
 * Configuration options for the YAML serializer.
 *
 * These options, with the exception of 'frontMatter', correspond to the options for js-yaml since
 * that is the library used under the hood. For more information see:
 *
 * http://nodeca.github.com/js-yaml/
 */
export interface YamlConfig {
  /**
   * Specifies if the YAML in the source files is defined as front matter or not.
   *
   * default: false
   */
  frontMatter?: boolean | ConverterFactory;

  /**
   * If frontMatter is set to true the content of the file will be stored in the result object.
   * This option lets you specify in which property it is stored.
   *
   * default: '_content'
   */
  contentKey?: string;

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

const defaultOptions: YamlConfig = {
  frontMatter: false,
  contentKey: '_content',
  indent: 2,
  skipInvalid: false,
  flowLevel: -1,
  sortKeys: false,
  lineWidth: 80,
  noRefs: false,
  noCompatMode: false,
  condenseFlow: false
};

export class YamlSerializer implements Serializer {
  private config: YamlConfig = {};
  private frontMatterConverter: Converter | undefined;

  public constructor(config: YamlConfig) {
    merge(this.config, defaultOptions, config);
    if (config.frontMatter instanceof ConverterFactory) {
      this.frontMatterConverter = config.frontMatter.create();
    }
  }

  public async deserialize(buffer: Buffer): Promise<object> {
    const data = buffer.toString('utf-8');
    if (this.config.frontMatter) {
      const doc = yamlFront.loadFront(data);
      let content = doc.__content.trim();
      if (this.frontMatterConverter) {
        content = await this.frontMatterConverter.publish(content);
      }
      doc[this.config.contentKey as string] = content;
      delete doc.__content;
      return doc;
    } else {
      return jsYaml.safeLoad(data);
    }
  }

  public async serialize(data: any): Promise<Buffer> {
    const options = omit(this.config, ['frontMatter', 'contentKey']);
    if (this.config.frontMatter) {
      const key = this.config.contentKey as string;
      const frontMatter = jsYaml.safeDump(omit(data, key), options);
      let output = '---\n' + frontMatter + '---';
      if (data[key]) {
        output += '\n' + data[key].replace(/^\s+|\s+$/g, '');
      }
      return Buffer.from(output, 'utf-8');
    } else {
      return Buffer.from(jsYaml.safeDump(data, options), 'utf-8');
    }
  }
}

export class YamlSerializerFactory extends SerializerFactory {
  public constructor(private config: YamlConfig) {
    super();
  }

  public create(): Serializer {
    return new YamlSerializer(this.config);
  }
}

export const yaml = (config?: YamlConfig) => new YamlSerializerFactory(config || {});
