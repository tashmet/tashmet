import {Pipe, Stream} from '../interfaces';

export class PersistPipe implements Pipe {
  private stream: Stream<Object>;

  public setStream(stream: Stream<Object>): void {
    this.stream = stream;
  }

  public process(input: any, next: (output: any) => void): void {
    this.stream.write(input);
    next(input);
  }
}
