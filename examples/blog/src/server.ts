import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo-stream';
import Nabu from '@tashmet/nabu';
import TashmetServer from '@tashmet/server';
import { terminal } from '@tashmet/terminal';

const store = Nabu
  .configure({
    logLevel: LogLevel.Debug,
    logFormat: terminal(),
    options: { io: 'blog' }
  })
  .use(mingo())
  .io('markdown', ns => Nabu.fs({
    scan: `./${ns.db}/${ns.collection}/*.md`,
    lookup: id => `./${ns.db}/${ns.collection}/${id}.md`,
    content: Nabu.yaml({
      frontMatter: true,
      contentKey: 'articleBody',
      merge: { _id: { $basename: ['$path', { $extname: '$path' } ] } },
    }),
  }))
  .bootstrap()

new TashmetServer(store).listen(8080);
