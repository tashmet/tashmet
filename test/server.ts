import TashmetServer from '../packages/server/dist/index.js'
import mingo from '../packages/mingo/dist/index.js'
import Memory from '../packages/memory/dist/index.js'

const store = Memory
  .configure({})
  .use(mingo())
  .bootstrap()

new TashmetServer(store).listen(8000);
