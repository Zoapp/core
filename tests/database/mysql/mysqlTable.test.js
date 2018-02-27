import dbCreate from "zoapp-core/database";

import { descriptor, dbConfig } from "../../test-config";


describe("database/mysql/mysqlTable", () => {
  it("returns Date objects for datetime/timestamp fields", async () => {
    const database = dbCreate({ descriptor, ...dbConfig });
    await database.reset();

    const v = await database.exists();
    expect(v).toBe(true);

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
    })
    const item = await table1.getItem("xxx");

    expect(item.creation_date).toEqual(date);
    expect(item.timestamp).toEqual(new Date(ts));
  });
});
