import { Document } from "@tashmet/tashmet";
import { IOSegment } from "../../interfaces";

export interface ExpressionIO {
  reader(expr: any): Document;
  writer(expr: any): Document;
}

export class ExpressionFileFormat implements IOSegment {
  readonly type = 'content';

  constructor(private field: string, private exprIO: ExpressionIO) {}

  get input(): Document[] {
    return [{ $set: { [this.field]: this.exprIO.reader(`$${this.field}`) } }];
  }

  get output(): Document[] {
    return [{ $set: { [this.field]: this.exprIO.writer(`$${this.field}`) } }];
  }
}
