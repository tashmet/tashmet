import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import Tashmet, { Document } from '../../packages/tashmet/dist/index.js';
import mingo from '../../packages/mingo/dist/index.js';
import Memory from '../../packages/memory/dist/index.js';
import json from '../../packages/json/dist/index.js';
import 'mingo/init/system';

chai.use(chaiAsPromised);

const { expect } = chai;

describe('json', () => {
  let tashmet: Tashmet;

  before(async () => {
    const store = Memory
      .configure({})
      .use(mingo())
      .use(json())
      .bootstrap();

    tashmet = await Tashmet.connect(store.proxy());
  })

  it('should convert object to json', async () => {
    const input = [
      { object: { foo: 'bar' } }
    ];
    const pipeline: Document[] = [
      { $documents: input },
      { $set: { json: { $objectToJson: '$object' } } }
    ];

    const doc = await tashmet.db('test').aggregate(pipeline).next();

    expect(doc).to.not.be.undefined;
    expect((doc as Document).json).to.eql('{\n  "foo": "bar"\n}');
  });

  it('should convert json to object', async () => {
    const input = [
      { json: '{ "foo": "bar" }' }
    ];
    const pipeline: Document[] = [
      { $documents: input },
      { $set: { object: { $jsonToObject: '$json' } } }
    ];

    const doc = await tashmet.db('test').aggregate(pipeline).next();

    expect(doc).to.not.be.undefined;
    expect((doc as Document).object).to.eql({ foo: 'bar' });
  });
});
