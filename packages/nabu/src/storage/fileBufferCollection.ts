import { BufferCollection } from './bufferCollection.js';
import * as fs from 'fs';

export class FileBufferCollection extends BufferCollection {
  async drop() {
    if (this.config.field === undefined && fs.existsSync(this.path)) {
      fs.rmSync(this.path);
    }
  }
}
