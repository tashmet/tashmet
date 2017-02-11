import * as express from 'express';
import {service} from '@samizdatjs/tiamat';
import {Middleware} from '../server';

let onHeaders = require('on-headers');
let chalk = require('chalk');
let log = require('fancy-log');

@service({
  name: 'tashmetu.RequestReporter',
  singleton: true
})
export class RequestReporter implements Middleware {
  public apply(req: express.Request, res: express.Response, next: any): void {
    onHeaders(res, () => {
      function status(code: number): string {
        if (code < 200) {
          return chalk.cyan(code);
        } else if (code < 400) {
          return chalk.green(code);
        } else {
          return chalk.red(code);
        }
      }
      log(chalk.cyan(req.method) + ' ' + req.originalUrl + ' ' + status(res.statusCode));
    });
    next();
  }
}
