import 'mingo/init/system';
import { expect } from 'chai';
import 'mocha';
import { MemoryStorageEngine, MingoCursorRegistry } from '../../src/storageEngine';
import { AggregateCommandHandler } from '../../src/commands/aggregate';


let store: MemoryStorageEngine;

describe('AggregateCommandHandler', () => {
  before(() => {
    store = new MemoryStorageEngine('testdb', {'test': [
      { _id: 1, category: "cake", type: "chocolate", qty: 10 },
      { _id: 2, category: "cake", type: "ice cream", qty: 25 },
      { _id: 3, category: "pie", type: "boston cream", qty: 20 },
      { _id: 4, category: "pie", type: "blueberry", qty: 15 }
    ]});
  });

  it.skip('should return aggregate result', async () => {
    const handler = new AggregateCommandHandler(new MingoCursorRegistry(), store, {});

    const {cursor, ok} = await handler.execute({
      aggregate: 'test',
      pipeline: [
        { $sort: { qty: 1 }},
        { $match: { category: "cake", qty: 10  } },
        { $sort: { type: -1 } }
      ]
    });
    expect(cursor).to.eql({});
  });
});
