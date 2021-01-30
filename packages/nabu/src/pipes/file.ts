import * as fs from 'fs';
import {ObjectPipeTransformFactory, StreamFactory} from './util';

export class FileStreamFactory implements StreamFactory {
  public constructor(private path: string, private transforms: ObjectPipeTransformFactory[]) {}

  public createReadable() {
    return fs.createReadStream(this.path, 'utf-8')
      .pipe(ObjectPipeTransformFactory.inputPipeline(this.transforms));
  }

  public createWritable() {
    return ObjectPipeTransformFactory.inputPipeline(this.transforms)
      .pipe(fs.createWriteStream(this.path, 'utf-8'));
  }
}
