import { Document } from "@tashmet/tashmet";
import { IORule } from "./content.js";

export class JsonIORule extends IORule {
  protected get reader(): Document {
    return { $jsonToObject: '$content' };
  }

  protected get writer(): Document {
    return { $objectToJson: '$content' }
  }
}
