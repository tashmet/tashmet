import mingo from '../../packages/mingo/dist/index.js';
import Memory from '../../packages/memory/dist/index.js';
import 'mingo/init/system';
import 'mocha';
import * as test from '../lib/index.js';


describe('memory', () => {
  const proxy = Memory
    .configure({})
    .use(mingo())
    .bootstrap()
    .proxy();

  describe('collection', () => {
    test.collection(proxy);
  });

  describe('validation', () => {
    test.validation(proxy);
  });
});
