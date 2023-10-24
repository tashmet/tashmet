import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo-stream';
import Nabu from '@tashmet/nabu';
import TashmetServer from '@tashmet/server';
import { terminal } from '@tashmet/terminal';

const store = Nabu
  .configure({
    logLevel: LogLevel.Debug,
    logFormat: terminal(),
  })
  .use(mingo())
  .io('md+yaml', (ns, options) => Nabu.yamlInDirectory(`./${ns.db}/${ns.collection}`, {
    extension: '.md',
    frontMatter: true,
    contentKey: options.contentKey || 'content',
  }))
  .bootstrap()

new TashmetServer(store).listen(8080);
