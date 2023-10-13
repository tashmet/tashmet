import { Document } from "@tashmet/tashmet";
import { ContentRule } from "../content";

export interface JsonContentRule {
  merge?: Document;

  construct?: Document;
}

export function json(config: JsonContentRule): ContentRule {
  const def: Required<JsonContentRule> = {
    merge: { _id: '$path' },
    construct: {},
  }
  const { merge, construct } = { ...def, ...config };

  return ContentRule
    .fromRootReplace({ $jsonToObject: '$content' }, { $objectToJson: '$content' }, merge)
    .assign(construct);
}
