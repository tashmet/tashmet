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
  .io('md+yaml', (ns, options) => Nabu
    .yaml({
      frontMatter: true,
      contentKey: options.contentKey || 'content',
    })
    .directory(`./${ns.db}/${ns.collection}`, '.md')
  )
  .bootstrap()

new TashmetServer(store).listen(8080);
