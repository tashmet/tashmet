---
description: Integration with Webpack
---

# Webpack

In your server you might want to incorporate the Webpack compiler to do hot reloads when working in development mode. This can be set up by providing a custom bootstrap method where you register the middleware in your server configuration.

```typescript
bootstrap(Application, {}, async container => {
  let middleware: express.RequestHandler[] = [];

  if (process.env.NODE_ENV === 'development') {
    let webpack = require('webpack');
    let webpackDevMiddleware = require('webpack-dev-middleware');
    let webpackHotMiddleware = require('webpack-hot-middleware');
    let config = require('webpack.config.js')('dev');

    let compiler = webpack(config);

    middleware = [
      webpackDevMiddleware(compiler, {
        publicPath: '/',
        stats: {colors: true}
      }),
      webpackHotMiddleware(compiler, {
        log: console.log
      })
    ];
  } else {
    middleware = [express.static('dist/client')];
  }

  container.register(Server.configuration({
    middleware: {
      '/': middleware,
    }
  }));
}).then(app => app.run(parseInt(process.env.PORT || '8080')));
```

