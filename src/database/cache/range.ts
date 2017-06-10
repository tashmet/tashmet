import {QueryOptions} from '../../interfaces';
import {QueryHashEvaluator} from './queryHash';
import {cloneDeep, some} from 'lodash';

export class Range {
  public constructor(public start: number, public end: number) {}

  public contains(other: Range): boolean {
    return other.start >= this.start && other.end <= this.end;
  }

  public overlapLength(other: Range): number {
    return Math.max(Math.min(this.end, other.end) - Math.max(this.start, other.start), 0);
  }
}

class RangeSet {
  private ranges: Range[] = [];

  public add(range: Range) {
    let startIndex = this.getStartIndex(range);
    let endIndex = this.getEndIndex(range);

    if (this.ranges.length === 0) {
      this.ranges.push(range);
    } else {
      range.start = Math.min(range.start, this.ranges[startIndex].start);
      range.end = Math.max(range.end, this.ranges[endIndex].end);
      this.ranges.splice(startIndex, endIndex - startIndex + 1, range);
    }
  }

  public contains(range: Range): boolean {
    return some(this.ranges, (r: Range) => {
      return r.contains(range);
    });
  }

  public findLargestOverlap(range: Range): Range | undefined {
    let overlapLength = 0;
    let bestMatch: Range | undefined = undefined;
    this.ranges.forEach((r: Range) => {
      if (range.overlapLength(r) > overlapLength) {
        bestMatch = r;
      }
    });
    return bestMatch;
  }

  private getStartIndex(range: Range) {
    for (let i = 0; i < this.ranges.length; i++) {
      if (range.start <= this.ranges[i].start) {
        return i;
      }
    }
    return this.ranges.length;
  }

  private getEndIndex(range: Range) {
    for (let i = 0; i < this.ranges.length; i++) {
      if (range.end <= this.ranges[i].end) {
        return i;
      }
    }
    return this.ranges.length > 0 ? this.ranges.length - 1 : 0;
  }
}

export class RangeEvaluator extends QueryHashEvaluator {
  public isCached(selector: any, options: QueryOptions): boolean {
    let matchingRanges: RangeSet = this.findCachedRanges(selector, options);
    return matchingRanges && matchingRanges.contains(this.createRange(options));
  }

  public setCached(selector: any, options: QueryOptions) {
    let hash = this.hash(selector, options);

    if (!this.cachedQueries[hash]) {
      this.cachedQueries[hash] = new RangeSet();
    }
    this.cachedQueries[hash].add(this.createRange(options));
  }

  public optimizeQuery(selector: any, options: QueryOptions): any {
    let matchingRanges = this.findCachedRanges(selector, options);
    if (matchingRanges) {
      let range = this.createRange(options);
      let overlapRange = matchingRanges.findLargestOverlap(range);
      if (overlapRange) {
        let optionsOut = cloneDeep(options);
        if (overlapRange.start <= range.start) {
          optionsOut.offset = overlapRange.end;
          optionsOut.limit = range.end - overlapRange.end;
        } else {
          optionsOut.offset = range.start;
          optionsOut.limit = overlapRange.start - range.start;
        }
        return {selector: selector, options: optionsOut};
      }
    }
    return {selector: selector, options: options};
  }

  protected hash(selector: any, options: QueryOptions): string {
    return JSON.stringify(selector) + JSON.stringify(options.sort);
  }

  private findCachedRanges(selector: any, options: QueryOptions): RangeSet {
    return this.cachedQueries[this.hash(selector, options)];
  }

  private createRange(options: QueryOptions): Range {
    return new Range(
      options.offset || 0,
      (options.offset || 0) + (options.limit || Number.MAX_VALUE)
    );
  }
}
