import Tashmet from '@tashmet/tashmet';
import ServerProxy from '@tashmet/proxy';

Tashmet
  .connect(new ServerProxy({ uri: 'http://localhost:8080' }))
  .then(async tashmet =>  {
    const db = tashmet.db('content');
    const posts = db.createCollection('posts', { storageEngine: { io: 'markdown' } });

    for await (const doc of posts.find({})) {
      console.log(doc);
    }

    tashmet.close();
  });
