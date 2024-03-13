import Tashmet from '@tashmet/tashmet';
import ServerProxy from '@tashmet/proxy';

Tashmet
  .connect(new ServerProxy('http://localhost:8080'))
  .then(async tashmet =>  {
    const db = tashmet.db('content');
    const posts = db.collection('posts');

    const cursor = posts.aggregate([
      { $set: { html: { $markdownToHtml: '$articleBody' } } }
    ]);

    for await (const doc of cursor) {
      console.log(doc);
    }

    tashmet.close();
  });
