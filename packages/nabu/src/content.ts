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