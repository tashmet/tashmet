import { Document } from "@tashmet/tashmet";
import { FileFormat } from "../interfaces";

export interface ExpressionIO {
  reader(expr: any): Document;
  writer(expr: any): Document;
}

export class ExpressionFileFormat implements FileFormat {
  constructor(private exprIO: ExpressionIO) {}

  get reader(): Document[] {
    return [{ $set: { 'content': this.exprIO.reader('$content') } }];
  }

  get writer(): Document[] {
    return [{ $set: { 'content': this.exprIO.writer('$content') } }];
  }
}
