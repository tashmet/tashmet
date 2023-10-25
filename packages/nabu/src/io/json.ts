import { Document } from "@tashmet/tashmet";
import { ContentRule } from "../content.js";
import { ContentRuleOptions, IORule } from "./content.js";

export interface JsonContentRule extends ContentRuleOptions {
  merge?: Document;

  construct?: Document;
}

export class JsonIORule extends IORule<JsonContentRule> {
  public constructor(config: JsonContentRule = {}) { super(config); }

  public directory(path: string, extension: string = '.json') {
    return super.directory(path, extension);
  }

  protected contentRule(config: JsonContentRule): ContentRule {
    const def: Required<JsonContentRule> = {
      merge: { _id: '$path' },
      construct: {},
    }
    const { merge, construct } = { ...def, ...config };

    return ContentRule
      .fromRootReplace({ $jsonToObject: '$content' }, { $objectToJson: '$content' }, merge)
      .assign(construct);
  }
}
