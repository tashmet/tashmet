import { Document } from "@tashmet/tashmet";
import { IOSegment } from "../interfaces";

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

export class Fill implements IOSegment {
  readonly type = 'content';

  constructor(private fields: Document) {}

  get input(): Document[] {
    const output = Object.keys(this.fields).reduce((acc, curr) => {
      acc[curr] = { value: this.fields[curr] };
      return acc;
    }, {} as Document);

    return [{ $fill: { output } }];
  }

  get output(): Document[] {
    return [];
  }
}

export class CompositeIO implements IOSegment {
  readonly type = 'buffer';

  public input: Document[] = [];
  public output: Document[] = [];

  constructor(...segments: IOSegment[]) {
    for (const segment of segments) {
      this.addSegment(segment);
    }
  }

  addSegment(segment: IOSegment) {
    this.input.push(...segment.input);
    this.output.unshift(...segment.output);
  }
}
