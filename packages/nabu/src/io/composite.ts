import { Document } from "@tashmet/tashmet";
import { IOSegment } from "../interfaces";

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
