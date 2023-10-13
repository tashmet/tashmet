import { Document } from "@tashmet/bridge";

export interface ContentRule {
  /**
   * Pipeline for reading content
   */
  read: Document[];

  /**
   * Pipeline for writing content
   */
  write: Document[];
}

export interface YamlContentRule {
  frontMatter?: boolean;

  contentKey?: string;

  merge?: Document;

  construct?: Document;
}

export interface JsonContentRule {
  merge?: Document;

  construct?: Document;
}

export class ContentRule implements ContentRule {
  public static fromRootReplace(parse: Document, serialize: Document, merge: Document): ContentRule {
    return new ContentRule(
      [
        { $replaceRoot: { newRoot: { $mergeObjects: [merge, parse] } } }
      ],
      [
        { $set: { content: serialize } }
      ]
    );
  }

  public static json(config: JsonContentRule): ContentRule {
    const def: Required<JsonContentRule> = {
      merge: { _id: '$path' },
      construct: {},
    }
    const { merge, construct } = { ...def, ...config };

    return ContentRule
      .fromRootReplace({ $jsonToObject: '$content' }, { $objectToJson: '$content' }, merge)
      .assign(construct);
  }

  public static yaml(config: YamlContentRule): ContentRule {
    const def: Required<YamlContentRule> = {
      frontMatter: false,
      contentKey: '_content',
      merge: { _id: '$path' },
      construct: {},
    }
    const { frontMatter, contentKey, merge, construct } = { ...def, ...config };

    const input = frontMatter ? { $yamlfmParse: '$content' } : { $yamlToObject: '$content' };
    const output = frontMatter ? { $yamlfmDump: '$content' } : { $objectToYaml: '$content' };

    return ContentRule
      .fromRootReplace(input, output, merge)
      .rename('_content', contentKey)
      .assign(construct);
  }


  public constructor(public read: Document[], public write: Document[]) {}

  public assign(construct: Document, destruct: Document = {}): ContentRule {
    return this.append(new ContentRule([{ $set: construct }], [{ $unset: Object.keys(construct) }]));
  }

  public rename(from: string, to: string): ContentRule {
    if (to === from) {
      return this;
    }
    return this.append(new ContentRule(
      [
        { $set: { [to]: `$${from}` } },
        { $unset: [from] },
      ],
      [
        { $set: { [from]: `$${to}` } },
        { $unset: [to] },
      ]
    ));
  }

  public append(rule: ContentRule): ContentRule {
    this.read.push(...rule.read);
    this.write.unshift(...rule.write);
    return this;
  }
}