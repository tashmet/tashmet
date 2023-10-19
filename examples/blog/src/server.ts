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
  .database('blog', coll => Nabu.fs({
    scan: `./${coll}/*.md`,
    lookup: id => `./${coll}/${id}.md`,
    content: Nabu.yaml({
      frontMatter: true,
      contentKey: 'articleBody',
      merge: { _id: { $basename: ['$path', { $extname: '$path' } ] } },
    }),
  }))
  .bootstrap()

new TashmetServer(store).listen(8080);
