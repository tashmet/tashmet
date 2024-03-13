import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo';
import Nabu from '@tashmet/nabu';
import TashmetServer from '@tashmet/server';
import { terminal } from '@tashmet/terminal';

const store = Nabu
  .configure({
    logLevel: LogLevel.Debug,
    logFormat: terminal(),
    dbFile: db => `${db}.yaml`,
  })
  .use(mingo())
  .bootstrap();

new TashmetServer(store, 8080).listen();
