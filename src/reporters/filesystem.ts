import {service, inject} from '@samizdatjs/tiamat';
import {FileSystem} from '../fs';
import * as chalk from 'chalk';

let log = require('fancy-log');

@service({
  name: 'tashmetu.FileSystemReporter',
  singleton: true
})
export class FileSystemReporter {
  public constructor(
    @inject('tashmetu.FileSystem') fileSys: FileSystem
  ) {
    fileSys.on('file-stored', (data: any, path: string) => {
      log(chalk.cyan('STR ') + path);
    });
  }
}
