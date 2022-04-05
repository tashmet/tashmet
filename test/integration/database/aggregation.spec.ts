import {expect} from 'chai';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import Tashmet, { Collection, Database } from '../../../packages/tashmet/dist';
import Mingo from '../../../packages/mingo/dist';
import 'mingo/init/system';

chai.use(chaiAsPromised);

describe('aggregation', () => {

  describe('on-demand materialized view', () => {
    let budgets: Collection;
    let salaries: Collection;
    let db: Database;

    before(async () => {
      const client = await Tashmet
        .configure()
        .use(Mingo, {})
        .connect();

      db = client.db('testdb');

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
      salaries.aggregate([
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

    it("should update/replace data", async () => {
      await salaries.insertMany([
        {
          _id: 11,
          employee: "Wren",
          dept: "Z",
          salary: 100000,
          fiscal_year: 2019,
        },
        {
          _id: 12,
          employee: "Zebra",
          dept: "A",
          salary: 150000,
          fiscal_year: 2019,
        },
        {
          _id: 13,
          employee: "headcount1",
          dept: "Z",
          salary: 120000,
          fiscal_year: 2020,
        },
        {
          _id: 14,
          employee: "headcount2",
          dept: "Z",
          salary: 120000,
          fiscal_year: 2020,
        },
      ]);

      salaries.aggregate([
        { $match: { fiscal_year: { $gte: 2019 } } },
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
          { _id: { fiscal_year: 2019, dept: "A" }, salaries: 275000 },
          { _id: { fiscal_year: 2019, dept: "Z" }, salaries: 410000 },
          { _id: { fiscal_year: 2020, dept: "Z" }, salaries: 240000 },
        ]);
    });

    it("only insert new data", async () => {
      await db.collection('orgArchive').insertMany([
        {
          employees: ["Ant", "Gecko"],
          dept: "A",
          fiscal_year: 2018,
        },
        {
          employees: ["Ant", "Bee"],
          dept: "A",
          fiscal_year: 2017,
        },
        {
          employees: ["Bee", "Cat"],
          dept: "Z",
          fiscal_year: 2018,
        },
        {
          employees: ["Cat"],
          dept: "Z",
          fiscal_year: 2017,
        },
      ]);

      await salaries.insertMany([
        {
          _id: 11,
          employee: "Wren",
          dept: "Z",
          salary: 100000,
          fiscal_year: 2019,
        },
        {
          _id: 12,
          employee: "Zebra",
          dept: "A",
          salary: 150000,
          fiscal_year: 2019,
        },
      ]);

      salaries.aggregate([
        { $match: { fiscal_year: 2019 } },
        {
          $group: {
            _id: { fiscal_year: "$fiscal_year", dept: "$dept" },
            employees: { $push: "$employee" },
          },
        },
        {
          $project: {
            _id: 0,
            dept: "$_id.dept",
            fiscal_year: "$_id.fiscal_year",
            employees: 1,
          },
        },
        {
          $merge: {
            into: 'orgArchive',
            on: ["dept", "fiscal_year"],
            whenMatched: "fail",
          },
        },
      ]);

      expect(db.collection('orgArchive').find().toArray()).to.eventually.eql([
        { employees: ["Ant", "Gecko"], dept: "A", fiscal_year: 2018 },
        { employees: ["Ant", "Bee"], dept: "A", fiscal_year: 2017 },
        { employees: ["Bee", "Cat"], dept: "Z", fiscal_year: 2018 },
        { employees: ["Cat"], dept: "Z", fiscal_year: 2017 },
        { employees: ["Ant", "Zebra"], dept: "A", fiscal_year: 2019 },
        { employees: ["Bee", "Cat", "Wren"], dept: "Z", fiscal_year: 2019 },
      ]);
    });

    it("sould merge results from multiple collections", async () => {
      const qr = db.collection('quarterlyreport');
      const po = db.collection('purchaseorders');

      await po.insertMany([
        {
          _id: 1,
          quarter: "2019Q1",
          region: "A",
          qty: 200,
          reportDate: new Date("2019-04-01"),
        },
        {
          _id: 2,
          quarter: "2019Q1",
          region: "B",
          qty: 300,
          reportDate: new Date("2019-04-01"),
        },
        {
          _id: 3,
          quarter: "2019Q1",
          region: "C",
          qty: 700,
          reportDate: new Date("2019-04-01"),
        },
        {
          _id: 4,
          quarter: "2019Q2",
          region: "B",
          qty: 300,
          reportDate: new Date("2019-07-01"),
        },
        {
          _id: 5,
          quarter: "2019Q2",
          region: "C",
          qty: 1000,
          reportDate: new Date("2019-07-01"),
        },
        {
          _id: 6,
          quarter: "2019Q2",
          region: "A",
          qty: 400,
          reportDate: new Date("2019-07-01"),
        },
      ]);

      po.aggregate([
        { $group: { _id: "$quarter", purchased: { $sum: "$qty" } } }, // group purchase orders by quarter
        {
          $merge: {
            into: 'quarterlyreport',
            on: "_id",
            whenMatched: "merge",
            whenNotMatched: "insert",
          },
        },
      ]);

      expect(await qr.find().toArray()).to.eql([
        { _id: "2019Q1", purchased: 1200 },
        { _id: "2019Q2", purchased: 1700 },
      ]);

      const rs = db.collection('reportedsales');
      await rs.insertMany([
        {
          _id: 1,
          quarter: "2019Q1",
          region: "A",
          qty: 400,
          reportDate: new Date("2019-04-02"),
        },
        {
          _id: 2,
          quarter: "2019Q1",
          region: "B",
          qty: 550,
          reportDate: new Date("2019-04-02"),
        },
        {
          _id: 3,
          quarter: "2019Q1",
          region: "C",
          qty: 1000,
          reportDate: new Date("2019-04-05"),
        },
        {
          _id: 4,
          quarter: "2019Q2",
          region: "B",
          qty: 500,
          reportDate: new Date("2019-07-02"),
        },
      ]);

      rs.aggregate([
        { $group: { _id: "$quarter", sales: { $sum: "$qty" } } }, // group sales by quarter
        {
          $merge: {
            into: 'quarterlyreport',
            on: "_id",
            whenMatched: "merge",
            whenNotMatched: "insert",
          },
        },
      ]);

      expect(await qr.find().toArray()).to.eql([
        { _id: "2019Q1", sales: 1950, purchased: 1200 },
        { _id: "2019Q2", sales: 500, purchased: 1700 },
      ]);
    });

    it("should use the pipeline to customize the merge", async () => {
      const votes = db.collection('votes');
      const mt = db.collection('monthlytotals');

      await votes.insertMany([
        { date: new Date("2019-05-01"), thumbsup: 1, thumbsdown: 1 },
        { date: new Date("2019-05-02"), thumbsup: 3, thumbsdown: 1 },
        { date: new Date("2019-05-03"), thumbsup: 1, thumbsdown: 1 },
        { date: new Date("2019-05-04"), thumbsup: 2, thumbsdown: 2 },
        { date: new Date("2019-05-05"), thumbsup: 6, thumbsdown: 10 },
        { date: new Date("2019-05-06"), thumbsup: 13, thumbsdown: 16 },
        { date: new Date("2019-05-07"), thumbsup: 14, thumbsdown: 10 },
      ]);

      await mt.insertOne({ _id: "2019-05", thumbsup: 26, thumbsdown: 31 });

      votes.aggregate([
        {
          $match: {
            date: { $gte: new Date("2019-05-07"), $lt: new Date("2019-05-08") },
          },
        },
        {
          $project: {
            _id: { $dateToString: { format: "%Y-%m", date: "$date" } },
            thumbsup: 1,
            thumbsdown: 1,
          },
        },
        {
          $merge: {
            into: 'monthlytotals',
            on: "_id",
            whenMatched: [
              {
                $addFields: {
                  thumbsup: { $add: ["$thumbsup", "$$new.thumbsup"] },
                  thumbsdown: { $add: ["$thumbsdown", "$$new.thumbsdown"] },
                },
              },
            ],
            whenNotMatched: "insert",
          },
        },
      ]);

      expect(await mt.find().toArray()).to.eql([
        { _id: "2019-05", thumbsup: 40, thumbsdown: 41 },
      ]);
    });

    it("should use variables to customize the merge", async () => {
      const cakeSales = db.collection('cakeSales');
      cakeSales.insertOne({ _id: 1, flavor: "chocolate", salesTotal: 1580, salesTrend: "up" });

      cakeSales.aggregate([
        {
          $merge: {
            into: 'cakeSales',
            let: { year: "2020" },
            whenMatched: [
              {
                $addFields: { salesYear: "$$year" },
              },
            ],
          },
        },
      ]);

      expect(await cakeSales.find().toArray()).to.eql([
        {
          _id: 1,
          flavor: "chocolate",
          salesTotal: 1580,
          salesTrend: "up",
          salesYear: "2020",
        },
      ]);
    });

    it("should fail 'whenMatched' with 'fail' option", async () => {
      const people = db.collection('people');
      await people.insertMany([
        { name: "Alice", age: 10 },
        { name: "Bob", age: 15 },
        { name: "Charlie", age: 20 },
      ]);

      expect(() => {
        people.aggregate([
          {
            $merge: {
              into: 'people',
              on: ["age"],
              whenMatched: "fail",
            },
          },
        ]);
      }).to.Throw;
    });
  });
});
