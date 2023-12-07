import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo';
import Nabu from '@tashmet/nabu';
import TashmetServer from '@tashmet/server';
import { terminal } from '@tashmet/terminal';

const store = Nabu
  .configure({
    logLevel: LogLevel.Debug,
    logFormat: terminal(),
  })
  .use(mingo())
  .bootstrap();

store.load().then(() => {
  new TashmetServer(store).listen(8080);
});
