import * as fs from 'fs';
import { StreamCollection } from './streamCollection';

export class DirectoryStreamCollection extends StreamCollection {
  async drop() {
    const path = this.path().split('*')[0];

    try {
      if (fs.readdirSync(path).length === 0) {
        fs.rmdirSync(path);
      }
    } catch (err) {
      // directory dows not exist
    }
  }
}
