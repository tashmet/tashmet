import { Document } from "@tashmet/tashmet";
import { IORule } from "./content.js";

export class JsonIORule extends IORule {
  protected reader(expr: any): Document {
    return { $jsonToObject: expr };
  }

  protected writer(expr: any): Document {
    return { $objectToJson: expr }
  }
}
