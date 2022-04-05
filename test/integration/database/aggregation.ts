import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import Tashmet, { Collection } from '../../../packages/tashmet/dist';
import Memory from '../../../packages/memory/dist';
import 'mingo/init/system';

chai.use(chaiAsPromised);

describe('aggregation', () => {
  let budgets: Collection;
  let salaries: Collection;

  before(async () => {
    const client = await Tashmet
      .configure()
      .use(Memory, {})
      .connect();

    const db = client.db('testdb');

    budgets = db.collection('budgets');
    salaries = db.collection('salaries')
  })

  beforeEach(async () => {
    await salaries.insertMany([
      {
        _id: 1,
        employee: "Ant",
        dept: "A",
        salary: 100000,
        fiscal_year: 2017,
      },
      {
        _id: 2,
        employee: "Bee",
        dept: "A",
        salary: 120000,
        fiscal_year: 2017,
      },
      {
        _id: 3,
        employee: "Cat",
        dept: "Z",
        salary: 115000,
        fiscal_year: 2017,
      },
      {
        _id: 4,
        employee: "Ant",
        dept: "A",
        salary: 115000,
        fiscal_year: 2018,
      },
      {
        _id: 5,
        employee: "Bee",
        dept: "Z",
        salary: 145000,
        fiscal_year: 2018,
      },
      {
        _id: 6,
        employee: "Cat",
        dept: "Z",
        salary: 135000,
        fiscal_year: 2018,
      },
      {
        _id: 7,
        employee: "Gecko",
        dept: "A",
        salary: 100000,
        fiscal_year: 2018,
      },
      {
        _id: 8,
        employee: "Ant",
        dept: "A",
        salary: 125000,
        fiscal_year: 2019,
      },
      {
        _id: 9,
        employee: "Bee",
        dept: "Z",
        salary: 160000,
        fiscal_year: 2019,
      },
      {
        _id: 10,
        employee: "Cat",
        dept: "Z",
        salary: 150000,
        fiscal_year: 2019,
      },
    ]);
  });

  afterEach(async () => {
    await salaries.deleteMany({});
  });

  it('should initially have correct documents', async () => {
    await salaries.aggregate([
      {
        $group: {
          _id: { fiscal_year: "$fiscal_year", dept: "$dept" },
          salaries: { $sum: "$salary" },
        },
      },
      {
        $merge: {
          into: 'budgets',
          on: "_id",
          whenMatched: "replace",
          whenNotMatched: "insert",
        },
      },
    ]);
    return expect(budgets.find().toArray())
      .to.eventually.eql([
        { _id: { fiscal_year: 2017, dept: "A" }, salaries: 220000 },
        { _id: { fiscal_year: 2017, dept: "Z" }, salaries: 115000 },
        { _id: { fiscal_year: 2018, dept: "A" }, salaries: 215000 },
        { _id: { fiscal_year: 2018, dept: "Z" }, salaries: 280000 },
        { _id: { fiscal_year: 2019, dept: "A" }, salaries: 125000 },
        { _id: { fiscal_year: 2019, dept: "Z" }, salaries: 310000 },
      ]);
  });
});
