import {Provider} from '@samizdatjs/tiamat';
import {Serializer, SerializerProvider} from '../content';
import {YamlConfig} from './meta';
import * as _ from 'lodash';

import yaml = require('js-yaml');
let yamlFront = require('yaml-front-matter');

class YamlSerializer implements Serializer {
  public constructor(private config: YamlConfig) {}

  public parse(data: string): Object {
    if (this.config.frontMatter) {
      let doc = yamlFront.loadFront(data);
      doc._content = doc.__content;
      delete doc.__content;
      return doc;
    } else {
      return yaml.safeLoad(data);
    }
  }

  public serialize(data: any): string {
    let metaKeys = _.filter(Object.keys(data), function(value) {
      return _.startsWith(value, '_');
    });
    let options = {
      indent: this.config.indent
    };
    if (this.config.frontMatter) {
      let frontMatter = yaml.safeDump(_.omit(data, metaKeys), options);
      let output = '---\n' + frontMatter + '---';
      if (data.__content) {
        output += '\n' + data.__content.replace(/^\s+|\s+$/g, '');
      }
      return output;
    } else {
      return yaml.safeDump(_.omit(data, metaKeys), options);
    }
  }
}

const defaultOptions: YamlConfig = {
  frontMatter: false,
  indent: 2
};

export class YamlProvider implements SerializerProvider {
  private config: YamlConfig;

  public constructor(config?: YamlConfig) {
    this.config = _.merge({}, defaultOptions, config || {});
  };

  public createSerializer(provider: Provider): Serializer {
    return new YamlSerializer(this.config);
  }
}
