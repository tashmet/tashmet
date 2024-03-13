import { Document } from "@tashmet/tashmet";
import { IOSegment } from "../interfaces";

export class Fill implements IOSegment {
  readonly type = 'content';

  constructor(private fields: Document) {}

  get input(): Document[] {
    const output = Object.keys(this.fields).reduce((acc, curr) => {
      acc[`content.${curr}`] = { value: this.fields[curr] };
      return acc;
    }, {} as Document);

    return [{ $fill: { output } }];
  }

  get output(): Document[] {
    const defaults: Document = {};
    for (const [k, v] of Object.entries(this.fields)) {
      const key = `content.${k}`;
      const selector = `$content.${k}`;
      defaults[key] = {
        $cond: {
          if: {
            $or: [
              { $eq: [selector, v] },
              { $eq: [selector, undefined] },
              { $eq: [selector, null] },
            ]
          },
          then: '$$REMOVE',
          else: selector,
        }
      }
    }
    return [ { $set: defaults } ];
  }
}
