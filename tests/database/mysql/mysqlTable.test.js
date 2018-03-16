import dbCreate from "zoapp-core/database";

import { descriptor, dbConfig } from "../../test-config";

describe("database/mysql/mysqlTable", () => {
  it("returns unix time for datetime/timestamp fields", async () => {
    const database = dbCreate({ descriptor, ...dbConfig });
    await database.reset();

    const exists = await database.exists();
    expect(exists).toBe(true);

    const table1 = database.getTable("table1");

    const date = new Date();
    const ts = Date.now();

    await table1.setItem(null, {
      id: "xxx",
      name: "test1",
      creation_date: date,
      timestamp: ts,
      value: 123,
      flag: true,
      refId: "yyy",
      obj: { sub: "sub", text: "text" },
      map: { dist: 0, len: 1 },
      list: ["test1", "test2", "test3"],
    });
    const item = await table1.getItem("xxx");

    expect(item.creation_date).toEqual(date.getTime());
    expect(item.timestamp).toEqual(ts);
  });

  describe("moveItems", () => {
    let table1;

    beforeEach(async () => {
      const database = dbCreate({ descriptor, ...dbConfig });
      await database.reset();

      const exists = await database.exists();
      expect(exists).toBe(true);

      table1 = database.getTable("table1");
    });

    it("reorders rows", async () => {
      ["it-1", "it-2", "it-3", "it-4"].forEach(async (item, index) => {
        await table1.setItem(null, {
          id: item,
          name: item,
          order: index + 1,
        });
      });

      let items = await table1.getItems();
      expect(items.map((i) => i.id)).toEqual(["it-1", "it-2", "it-3", "it-4"]);
      expect(items.map((i) => i.order)).toEqual([1, 2, 3, 4]);

      // move first item at the third position
      try {
        await table1.moveItem("parameter not used", 1, 3);
      } catch (e) {
        throw e;
      }

      items = await table1.getItems();
      expect(items.map((i) => i.id)).toEqual(["it-2", "it-3", "it-1", "it-4"]);
      expect(items.map((i) => i.order)).toEqual([1, 2, 3, 4]);

      // move first item in second position
      try {
        await table1.moveItem("parameter not used", 1, 2);
      } catch (e) {
        throw e;
      }

      items = await table1.getItems();
      expect(items.map((i) => i.id)).toEqual(["it-3", "it-2", "it-1", "it-4"]);
      expect(items.map((i) => i.order)).toEqual([1, 2, 3, 4]);

      // move third item in second position
      try {
        await table1.moveItem("parameter not used", 3, 2);
      } catch (e) {
        throw e;
      }

      items = await table1.getItems();
      expect(items.map((i) => i.id)).toEqual(["it-3", "it-1", "it-2", "it-4"]);
      expect(items.map((i) => i.order)).toEqual([1, 2, 3, 4]);

      // move the fourth item in second position
      try {
        await table1.moveItem("parameter not used", 4, 2);
      } catch (e) {
        throw e;
      }

      items = await table1.getItems();
      expect(items.map((i) => i.id)).toEqual(["it-3", "it-4", "it-1", "it-2"]);
      expect(items.map((i) => i.order)).toEqual([1, 2, 3, 4]);

      // move the first item in fourth position
      try {
        await table1.moveItem("parameter not used", 1, 4);
      } catch (e) {
        throw e;
      }

      items = await table1.getItems();
      expect(items.map((i) => i.id)).toEqual(["it-4", "it-1", "it-2", "it-3"]);
      expect(items.map((i) => i.order)).toEqual([1, 2, 3, 4]);

      // move the fourth item in first position
      try {
        await table1.moveItem("parameter not used", 4, 1);
      } catch (e) {
        throw e;
      }

      items = await table1.getItems();
      expect(items.map((i) => i.id)).toEqual(["it-3", "it-4", "it-1", "it-2"]);
      expect(items.map((i) => i.order)).toEqual([1, 2, 3, 4]);
    });

    it("does nothing if `from` and `to` are equal", async () => {
      const result = await table1.moveItem("parameter not used", 1, 1);

      expect(result).toBe(true);
    });

    it("throws an error if `from` value is less than 1", async () => {
      await expect(table1.moveItem("parameter not used", 0, 1)).rejects.toThrow(
        "`from` parameter must be > 0",
      );
    });

    it("throws an error when `to` value is larger than the items", async () => {
      ["it-1", "it-2"].forEach(async (item, index) => {
        await table1.setItem(null, {
          id: item,
          name: item,
          order: index + 1,
        });
      });

      await expect(table1.moveItem("parameter not used", 1, 3)).rejects.toThrow(
        "`to` parameter is larger than the number of items",
      );
    });
  });

  describe("getItems", () => {
    it("get items ordered", async () => {
      const database = dbCreate({ descriptor, ...dbConfig });
      await database.reset();

      const exists = await database.exists();
      expect(exists).toBe(true);

      const table1 = database.getTable("table1");
      // insert items in controlled-random order
      [
        {
          name: "it-3",
          order: 2,
        },
        {
          name: "it-2",
          order: 1,
        },
        {
          name: "it-1",
          order: 3,
        },
      ].forEach(async (item) => {
        await table1.setItem(null, {
          id: item.name,
          name: item.name,
          order: item.order,
        });
      });

      const items = await table1.getItems();
      expect(items.map((i) => i.id)).toEqual(["it-2", "it-3", "it-1"]);
    });
  });

  describe("size", () => {
    it("returns the number of results", async () => {
      const database = dbCreate({ descriptor, ...dbConfig });
      await database.reset();

      const table1 = database.getTable("table1");

      let count = await table1.size();
      expect(count).toEqual(0);

      await table1.setItem(null, {
        id: "id1",
      });
      count = await table1.size();
      expect(count).toEqual(1);

      await table1.setItem(null, {
        id: "id2",
      });
      count = await table1.size();
      expect(count).toEqual(2);
    });

    it("returns the number of results restricted by a WHERE clause", async () => {
      const database = dbCreate({ descriptor, ...dbConfig });
      await database.reset();

      const table1 = database.getTable("table1");

      [
        { name: "it-3", order: 2 },
        { name: "it-2", order: 1 },
        { name: "it-1", order: 3 },
      ].forEach(async (item) => {
        await table1.setItem(null, {
          id: item.name,
          name: item.name,
          order: item.order,
        });
      });
      let count = await table1.size("name='it-1'");
      expect(count).toEqual(1);
      count = await table1.size("name='it-0'");
      expect(count).toEqual(0);
      count = await table1.size("order>1");
      expect(count).toEqual(2);
    });
  });
});
