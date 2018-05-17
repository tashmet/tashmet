import {QueryOptions} from '../../interfaces';
import {QueryHashEvaluator} from './queryHash';
import {some} from 'lodash';

export class Range {
  public constructor(public start: number, public end: number) {}

  public contains(other: Range): boolean {
    return other.start >= this.start && other.end <= this.end;
  }

  public overlapLength(other: Range): number {
    const minEnd = Math.min(this.end, other.end);
    const maxStart = Math.max(this.start, other.start);
    return Math.max(minEnd - maxStart + 1, 0);
  }
}

export class RangeSet {
  private ranges: Range[] = [];

  public add(range: Range) {
    let startIndex = this.getStartIndex(range);
    let endIndex = this.getEndIndex(range);

    if (this.ranges.length === 0 || startIndex === this.ranges.length) {
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
    let largestOverlapLength = 0;
    let largestRange: Range | undefined = undefined;
    for (let r of this.ranges) {
      const overlapLength = range.overlapLength(r);
      if (overlapLength > largestOverlapLength) {
        largestOverlapLength = overlapLength;
        largestRange = r;
      }
    }
    return largestRange;
  }

  public size(): number {
    return this.ranges.length;
  }

  private getStartIndex(range: Range) {
    for (let i = 0; i < this.ranges.length; i++) {
      if (range.start <= this.ranges[i].end) {
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
  protected isCached(selector: any, options: QueryOptions): boolean {
    let matchingRanges: RangeSet = this.findCachedRanges(selector, options);
    return Boolean(matchingRanges && matchingRanges.contains(this.createRange(options)));
  }

  protected setCached(selector: any, options: QueryOptions) {
    let hash = this.hash(selector, options);

    if (!this.cachedQueries[hash]) {
      this.cachedQueries[hash] = new RangeSet();
    }
    this.cachedQueries[hash].add(this.createRange(options));
  }

  protected optimizeQuery(selector: any, options: QueryOptions) {
    let matchingRanges = this.findCachedRanges(selector, options);
    if (matchingRanges) {
      let range = this.createRange(options);
      let overlapRange = matchingRanges.findLargestOverlap(range);
      if (overlapRange) {
        if (overlapRange.start <= range.start) {
          options.offset = overlapRange.end;
          options.limit = range.end - overlapRange.end;
        } else {
          options.offset = range.start;
          options.limit = overlapRange.start - range.start;
        }
      }
    }
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
