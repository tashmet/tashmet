import TashmetServer from '../packages/server/dist/index.js'
import mingo from '../packages/mingo/aggregation/dist/index.js'
import memory from '../packages/memory/dist/index.js'

TashmetServer
  .configure({})
  .use(mingo())
  .use(memory())
  .bootstrap()
  .listen(8000);
