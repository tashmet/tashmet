import { Document } from "@tashmet/tashmet";
import { FileFormat } from "../interfaces";

export interface ExpressionIO {
  reader(expr: any): Document;
  writer(expr: any): Document;
}

export class ExpressionFileFormat implements FileFormat {
  constructor(private field: string, private exprIO: ExpressionIO) {}

  get reader(): Document[] {
    return [{ $set: { [this.field]: this.exprIO.reader(`$${this.field}`) } }];
  }

  get writer(): Document[] {
    return [{ $set: { [this.field]: this.exprIO.writer(`$${this.field}`) } }];
  }
}
