import {service, inject} from '@samizdatjs/tiamat';
import {Collection, Database, DocumentError} from '../content';
import * as chalk from 'chalk';

let log = require('fancy-log');

@service({
  name: 'tashmetu.DatabaseReporter',
  singleton: true
})
export class DatabaseReporter {
  public constructor(
    @inject('tashmetu.Database') database: Database,
  ) {
    database.on('document-upserted', (doc: any, collection: Collection) => {
      log(chalk.cyan('UPS ') + doc._id + ' to ' + collection.name());
    });
    database.on('document-removed', (doc: any, collection: Collection) => {
      log(chalk.cyan('REM ') + doc._id + ' to ' + collection.name());
    });
    database.on('document-error', (err: DocumentError, collection: Collection) => {
      log(chalk.red('ERR ') + err.instance._id + ' in ' + collection.name());
      console.log('\n\t' + chalk.red(err.message) + '\n');
    });
  }
}
