---
title: Connection
description: Methods of connecting to a database
---

# Overview

Tashmet is split into two main parts, the storage engine and the client. The client issues commands in the form of plain objects to the storage engine via a proxy interface.
The storage engine can live in the same application or be connected to remotely through socket.

# Local connection

The basic use case for Tashmet is one where both the storage engine and client (Tashmet) is run in the same app. The storage engine exposes a proxy interface that we can make the
connection through. 

See the [Hello world](/docs/hello-world) example for how this is set up.

---

# Remote connection

A more advanced use case is when the storage engine runs in a different process, or even on a remote server. We can for instance have the Tashmet client run in a browser connecting to the server, thus bypassing the need for a more traditional rest-inteface approach.

{% hint style="check" %}
This is currently an experimental feature that lacks the security necessary for production. Only use for developmental purposes.
{% /hint %}

## Blog example

In the following example we will create a server that listens for incoming connections on port 8080.

{% file title="src/server.ts" %}
```typescript
import { LogLevel } from '@tashmet/core';
import mingo from '@tashmet/mingo';
import Nabu from '@tashmet/nabu';
import TashmetServer from '@tashmet/server';
import { terminal } from '@tashmet/terminal';

const store = Nabu
  .configure({
    logLevel: LogLevel.Debug,
    logFormat: terminal(),
    persistentState: db => `${db}.yaml`,
  })
  .use(mingo())
  .bootstrap();

new TashmetServer(store).listen(8080);
```
{% /file %}

The blog posts are stored in `content/posts` and we have set up a Nabu database configuration that defines our collection. In the next step, when we set up the client and access the database called `content` this file will be read by the storage engine as per the `peristentState` option we specified above.

{% file title="content.yaml" %}
```yaml
collections:
  posts:
    storageEngine:
      directory:
        path: ./content/posts
        extension: .md
        format:
          yaml:
            frontMatter: true
            contentKey: articleBody
```
{% /file %}

In the client we establish a connection using the `ServerProxy` then we are free to use the database as we normally would. Notice how we run an aggregation where markdown content is transformed to HTML. This operation is carried out in the storage engine on the server and the results are sent to the client. This means that if we run this in a browser the bundle size is quite small since it only contains the Tashmet client, while we still have all the power to do things like complex data transformations.

{% file title="src/client.ts" %}
```typescript
import Tashmet from '@tashmet/tashmet';
import ServerProxy from '@tashmet/proxy';

Tashmet
  .connect(new ServerProxy({ uri: 'http://localhost:8080' }))
  .then(async tashmet =>  {
    const db = tashmet.db('content');
    const posts = await db.collection('posts');

    const cursor = posts.aggregate([
      { $set: { html: { $markdownToHtml: '$articleBody' } } }
    ]);

    for await (const doc of cursor) {
      console.log(doc);
    }

    tashmet.close();
  });
```
{% /file %}