import Tashmet from '@tashmet/tashmet';
import ServerProxy from '@tashmet/proxy';

Tashmet
  .connect(new ServerProxy({ uri: 'http://localhost:8080' }))
  .then(async tashmet =>  {
    const db = tashmet.db('content');
    const posts = await db.createCollection('posts', {
      storageEngine: {
        io: 'md+yaml',
        contentKey: 'articleBody',
      }
    });

    const cursor = posts.aggregate([
      { $set: { html: { $markdownToHtml: '$articleBody' } } }
    ]);

    for await (const doc of cursor) {
      console.log(doc);
    }

    tashmet.close();
  });
