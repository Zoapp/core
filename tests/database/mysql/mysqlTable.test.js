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
      ["item1", "item2", "item3"].forEach(async (item, index) => {
        await table1.setItem(null, {
          id: item,
          name: item,
          order: index + 1,
        });
      });

      let items = await table1.getItems();
      expect(items.map((i) => i.id)).toEqual(["item1", "item2", "item3"]);

      try {
        await table1.moveItem("item1", 1, 3);
      } catch (e) {
        throw e;
      }

      items = await table1.getItems();
      expect(items.map((i) => i.id)).toEqual(["item3", "item2", "item1"]);
    });

    it("does nothing if `from` and `to` are equal", async () => {
      const result = await table1.moveItem("item1", 1, 1);

      expect(result).toBe(true);
    });

    it("throws an error if `from` value is less than 1", async () => {
      await expect(table1.moveItem("item1", 0, 1)).rejects.toThrow(
        "`from` parameter must be > 0",
      );
    });

    it("throws an error when `to` value is larger than the items", async () => {
      ["item1", "item2"].forEach(async (item, index) => {
        await table1.setItem(null, {
          id: item,
          name: item,
          order: index + 1,
        });
      });

      await expect(table1.moveItem("item1", 1, 3)).rejects.toThrow(
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
          name: "item3",
          order: 2,
        },
        {
          name: "item2",
          order: 1,
        },
        {
          name: "item1",
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
      expect(items.map((i) => i.id)).toEqual(["item2", "item3", "item1"]);
    });
  });
});
