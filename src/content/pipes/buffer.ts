import {Collection, Pipe} from '../interfaces';

export class BufferPipe implements Pipe {
  private buffer: Collection;
  private target: number;
  private count = 0;

  public setCollection(collection: Collection): void {
    this.buffer = collection;
  }

  public setCount(count: number) {
    this.target = count;
  }

  public getCount(): number {
    return this.target;
  }

  public decCount() {
    this.target -= 1;
    this.checkReady();
  }

  public process(input: any, next: (output: any) => void): void {
    this.buffer.on('ready', () => {
      next(input);
    });
    this.buffer.upsert(input, () => { return; });
    this.count += 1;
    this.checkReady();
  }

  private checkReady() {
    if (this.count === this.target) {
      this.buffer.emit('ready');
    }
  }
}
