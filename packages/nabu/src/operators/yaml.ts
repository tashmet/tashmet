import { Options } from "mingo/core";
import { Iterator } from "mingo/lazy";
import { RawObject } from "mingo/types";
import { setValue, removeValue, resolve } from "mingo/util";

import jsYaml = require('js-yaml');
import { Encoding, Transform } from "../interfaces";
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
  frontMatter?: boolean;

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

/**
 * Adds new fields to documents.
 * Outputs documents that contain all existing fields from the input documents and newly added fields.
 *
 * @param {Iterator} collection
 * @param {Object} expr
 * @param {Options} options
 */
export function $yamlParse(
  collection: Iterator,
  expr: RawObject,
  options?: Options
): Iterator {
  const cfg = Object.assign({}, defaultOptions, expr);

  return collection.map((obj: RawObject) => {
    const newObj = { ...obj };
    const key = expr['key'] as string || 'content';
    const encoding = expr['encoding'] as Encoding || 'utf8';
    const buffer = resolve(obj, key) as Buffer;
    let doc: any;

    const data = buffer.toString(encoding);
    if (cfg.frontMatter) {
      doc = yamlFront.loadFront(data);
      const content = doc.__content.trim();
      doc[cfg.contentKey as string] = content;
      delete doc.__content;
    } else {
      doc = jsYaml.safeLoad(data)
      if (typeof doc !== 'object') {
        throw new Error('Deserialized YAML is not an object')
      }
    }
    setValue(newObj, key, doc);

    return newObj;
  });
}

export function $yamlDump(
  collection: Iterator,
  expr: RawObject,
  options?: Options
): Iterator {
  const cfg = Object.assign({}, defaultOptions, expr);

  return collection.map((obj: RawObject) => {
    const newObj = { ...obj };
    const key = expr['key'] as string || 'content';
    const encoding = expr['encoding'] as Encoding || 'utf8';
    const {frontMatter, contentKey, ...options} = cfg;
    const value = resolve(newObj, key)
    let output: string;

    if (frontMatter && contentKey) {
      removeValue(newObj, `${key}.${contentKey}`);
      const frontMatterData = jsYaml.safeDump(value, options);
      output = '---\n' + frontMatter + '---';
      if (obj[contentKey]) {
        //output += '\n' + data[contentKey].replace(/^\s+|\s+$/g, '');
      }
    } else {
      output = jsYaml.safeDump(value, options);
    }

    setValue(newObj, key, Buffer.from(output, encoding));

    return newObj;
  });
}

export const yaml = (encoding: Encoding = 'utf8') => {
  return {
    input: [{$yamlParse: {key: 'content', encoding}}],
    output: [{$yamlDump: {key: 'content', encoding}}],
  } as Transform;
}
