# Blog

This is a client/server example application that shows how to publish documents
stored on the file system though an API with a separate client application that
can access the data.

## Documentation
For a more in-depth explanation, refer to the documentation found here
[https://tashmet.gitbook.io/tashmet/getting-started/examples/blog](https://tashmet.gitbook.io/tashmet/getting-started/examples/blog)

## Instructions

After cloning this repo, do the following:

```text
cd tashmet/examples/blog
npm install
npm build
```

### Server

Now you are ready to run the server.

```text
npm start
```

To check out the API endpoint, turn your browser to http://localhost:8000/api/posts


### Client

With the server running, the client can simply be started in another terminal

```text
npm run client
```

It will fetch the posts from the API and log the result to the console.
