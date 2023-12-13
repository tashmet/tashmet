import { Document } from "@tashmet/tashmet";
import { FileFormat } from "../interfaces.js";

export class JsonFileFormat implements FileFormat {
  public reader(expr: any): Document {
    return { $jsonToObject: expr };
  }

  public writer(expr: any): Document {
    return { $objectToJson: expr }
  }
}
