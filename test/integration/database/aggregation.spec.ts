import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import 'mocha';

import Tashmet, { Collection, Database } from '../../../packages/tashmet/dist/index.js';
import mingo from '../../../packages/mingo/dist/index.js';
import Memory from '../../../packages/memory/dist/index.js';
import 'mingo/init/system';

chai.use(chaiAsPromised);

const { expect } = chai;

describe('aggregation', () => {

  describe('$merge', () => {
    let budgets: Collection;
    let salaries: Collection;
    let db: Database;

    before(async () => {
      const store = Memory
        .configure({})
        .use(mingo())
        .bootstrap();

      const client = await Tashmet.connect(store.proxy());

      db = client.db('testdb');

      budgets = await db.createCollection('budgets');
      salaries = await db.createCollection('salaries')
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
      ]).toArray();
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

      await salaries.aggregate([
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
      ]).toArray();

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
      await db.createCollection('orgArchive');
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

      await salaries.aggregate([
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
      ]).toArray();

      expect(db.collection('orgArchive').find().toArray()).to.eventually.eql([
        { employees: ["Ant", "Gecko"], dept: "A", fiscal_year: 2018 },
        { employees: ["Ant", "Bee"], dept: "A", fiscal_year: 2017 },
        { employees: ["Bee", "Cat"], dept: "Z", fiscal_year: 2018 },
        { employees: ["Cat"], dept: "Z", fiscal_year: 2017 },
        { employees: ["Ant", "Zebra"], dept: "A", fiscal_year: 2019 },
        { employees: ["Bee", "Cat", "Wren"], dept: "Z", fiscal_year: 2019 },
      ]);
    });

    it("should merge results from multiple collections", async () => {
      const qr = db.collection('quarterlyreport');
      const po = await db.createCollection('purchaseorders');

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

      await po.aggregate([
        { $group: { _id: "$quarter", purchased: { $sum: "$qty" } } }, // group purchase orders by quarter
        {
          $merge: {
            into: 'quarterlyreport',
            on: "_id",
            whenMatched: "merge",
            whenNotMatched: "insert",
          },
        },
      ]).toArray();

      expect(await qr.find().toArray()).to.eql([
        { _id: "2019Q1", purchased: 1200 },
        { _id: "2019Q2", purchased: 1700 },
      ]);

      const rs = await db.createCollection('reportedsales');
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

      await rs.aggregate([
        { $group: { _id: "$quarter", sales: { $sum: "$qty" } } }, // group sales by quarter
        {
          $merge: {
            into: 'quarterlyreport',
            on: "_id",
            whenMatched: "merge",
            whenNotMatched: "insert",
          },
        },
      ]).toArray();

      expect(await qr.find().toArray()).to.eql([
        { _id: "2019Q1", sales: 1950, purchased: 1200 },
        { _id: "2019Q2", sales: 500, purchased: 1700 },
      ]);
    });

    it("should use the pipeline to customize the merge", async () => {
      const votes = await db.createCollection('votes');
      const mt = await db.createCollection('monthlytotals');

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

      await votes.aggregate([
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
      ]).toArray();

      expect(await mt.find().toArray()).to.eql([
        { _id: "2019-05", thumbsup: 40, thumbsdown: 41 },
      ]);
    });

    it.skip("should use variables to customize the merge", async () => {
      const cakeSales = db.collection('cakeSales');
      cakeSales.insertOne({ _id: 1, flavor: "chocolate", salesTotal: 1580, salesTrend: "up" });

      await cakeSales.aggregate([
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
      ]).toArray();

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
      const people = await db.createCollection('people');
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

  describe('$out', () => {
    let books: Collection;
    let authors: Collection;
    let db: Database;

    before(async () => {
      const store = Memory
        .configure({})
        .use(mingo())
        .bootstrap();

      const client = await Tashmet.connect(store.proxy());

      db = client.db('testdb');

      books = await db.createCollection('books');
      authors = db.collection('authors');
    });

    it('should write to output collection', async () => {
      await books.insertMany([
        { _id : 8751, title : "The Banquet", author : "Dante", "copies" : 2 },
        { _id : 8752, title : "Divine Comedy", author : "Dante", "copies" : 1 },
        { _id : 8645, title : "Eclogues", author : "Dante", "copies" : 2 },
        { _id : 7000, title : "The Odyssey", author : "Homer", "copies" : 10 },
        { _id : 7020, title : "Iliad", author : "Homer", "copies" : 10 }
      ]);

      await books.aggregate( [
        { $group : { _id : "$author", books: { $push: "$title" } } },
        { $out : "authors" }
      ]).toArray();

      expect(await authors.find().toArray()).to.eql([
        { _id : "Dante", books : [ "The Banquet", "Divine Comedy", "Eclogues" ] },
        { _id : "Homer", books : [ "The Odyssey", "Iliad" ] },
      ]);
    });
    
    it('should replace existing data', async () => {
      await books.aggregate( [
        { $group : { _id : "$author", books: { $push: "$title" } } },
        { $out : "authors" }
      ]).toArray();

      expect(await authors.find().toArray()).to.eql([
        { _id : "Dante", books : [ "The Banquet", "Divine Comedy", "Eclogues" ] },
        { _id : "Homer", books : [ "The Odyssey", "Iliad" ] },
      ]);
    });
  });


  describe('$lookup', () => {
    let client: Tashmet;

    before(async () => {
      const store = Memory
        .configure({})
        .use(mingo())
        .bootstrap();

      client = await Tashmet.connect(store.proxy());
    });

    it("should perform a single equality join with", async () => {
      let db = client.db('testdb1');
      let orders = await db.createCollection('orders');
      let inventory = await db.createCollection('inventory');

      await orders.insertMany( [
        { _id : 1, item : "almonds", price : 12, quantity : 2 },
        { _id : 2, item : "pecans", price : 20, quantity : 1 },
        { _id : 3  }
      ] );

      await inventory.insertMany( [
        { _id : 1, sku : "almonds", description: "product 1", instock : 120 },
        { _id : 2, sku : "bread", description: "product 2", instock : 80 },
        { _id : 3, sku : "cashews", description: "product 3", instock : 60 },
        { _id : 4, sku : "pecans", description: "product 4", instock : 70 },
        { _id : 5, sku: null, description: "Incomplete" },
        { _id : 6 }
      ] );

      expect(await orders.aggregate( [
        {
          $lookup:
            {
              from: "inventory",
              localField: "item",
              foreignField: "sku",
              as: "inventory_docs"
            }
        }
      ] ).toArray()).to.eql([
        {
          _id : 1,
          item : "almonds",
          price : 12,
          quantity : 2,
          inventory_docs : [
              { _id : 1, sku : "almonds", description : "product 1", instock : 120 }
          ]
        },
        {
          _id : 2,
          item : "pecans",
          price : 20,
          quantity : 1,
          inventory_docs : [
              { _id : 4, sku : "pecans", description : "product 4", instock : 70 }
          ]
        },
        {
          _id : 3,
          inventory_docs : [
              { _id : 5, sku : null, description : "Incomplete" },
              { _id : 6 }
          ]
        }
      ]);
    });

    it.skip("should work an array", async () => {
      const db = client.db('testdb2');
      const classes = await db.createCollection('classes');
      const members = await db.createCollection('members');

      await classes.insertMany( [
        { _id: 1, title: "Reading is ...", enrollmentlist: [ "giraffe2", "pandabear", "artie" ], days: ["M", "W", "F"] },
        { _id: 2, title: "But Writing ...", enrollmentlist: [ "giraffe1", "artie" ], days: ["T", "F"] }
      ] );

      await members.insertMany( [
        { _id: 1, name: "artie", joined: "2016-05-01", status: "A" },
        { _id: 2, name: "giraffe", joined: "2017-05-01", status: "D" },
        { _id: 3, name: "giraffe1", joined: "2017-10-01", status: "A" },
        { _id: 4, name: "panda", joined: "2018-10-11", status: "A" },
        { _id: 5, name: "pandabear", joined: "2018-12-01", status: "A" },
        { _id: 6, name: "giraffe2", joined: "2018-12-01", status: "D" }
      ] );

      expect(await classes.aggregate( [
        {
          $lookup: {
            from: "members",
            localField: "enrollmentlist",
            foreignField: "name",
            as: "enrollee_info"
          }
        }
      ] ).toArray()).to.eql([
        {
          _id : 1,
          title : "Reading is ...",
          enrollmentlist : [ "giraffe2", "pandabear", "artie" ],
          days : [ "M", "W", "F" ],
          enrollee_info : [
            { _id: 1, name: "artie", joined: "2016-05-01", status: "A" },
            { _id: 5, name: "pandabear", joined: "2018-12-01", status: "A" },
            { _id: 6, name: "giraffe2", joined: "2018-12-01", status: "D" }
          ]
        },
        {
          _id : 2,
          title : "But Writing ...",
          enrollmentlist : [ "giraffe1", "artie" ],
          days : [ "T", "F" ],
          enrollee_info : [
            { _id : 1, name : "artie", joined: "2016-05-01", status: "A" },
            { _id : 3, name : "giraffe1", joined: "2017-10-01", status: "A" }
          ]
        }
      ]);
    });
  });
});
