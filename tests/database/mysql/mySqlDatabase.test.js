/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import dbCreate from "zoapp-core/database";

import { descriptor, dbConfig } from "../../test-config";

describe("database/mysql/mysqlDatabase", () => {
  test("Open/Create/Delete MySQL database", async () => {
    const database = dbCreate(dbConfig);
    // Load it
    await database.load();
    // Delete it
    await database.delete();
  });

  test("Open with descriptor/Create/Reset table MySQL database", async () => {
    const database = dbCreate({ descriptor, ...dbConfig });
    // Reset it
    await database.reset();
    // Check if exist
    const v = await database.exists();
    expect(v).toBe(true);

    const table1 = database.getTable("table1");
    const size = await table1.size();
    expect(size === 0).toBe(true);
  });

  test("Convert query to SQL syntax database", async () => {
    const database = dbCreate({ descriptor, ...dbConfig });
    // Reset it
    await database.reset();
    // Check if exist
    const v = await database.exists();
    expect(v).toBe(true);

    const table1 = database.getTable("table1");
    let queryName = "xxx";
    let where = table1.doWhereQuery(queryName);
    logger.info(`${queryName}=>${where}`);
    queryName = "name=xxx";
    where = table1.doWhereQuery(queryName);
    logger.info(`${queryName}=>${where}`);
    queryName = "name=xxx OR id=xxx";
    where = table1.doWhereQuery(queryName);
    logger.info(`${queryName}=>${where}`);
    queryName = "name=xxx AND id=xxx";
    where = table1.doWhereQuery(queryName);
    logger.info(`${queryName}=>${where}`);
    queryName = "name=null";
    where = table1.doWhereQuery(queryName);
    logger.info(`${queryName}=>${where}`);
    queryName = "name=NULL AND id!=NULL";
    where = table1.doWhereQuery(queryName);
    logger.info(`${queryName}=>${where}`);
  });

  test("set/get Items table MySQL database", async () => {
    const database = dbCreate({ descriptor, ...dbConfig });
    await database.reset();

    // check if exists
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
    });

    let item = await table1.getItem("xxx");
    expect(item.name).toEqual("test1");

    await table1.setItem("xxx", { id: "xxx", name: "test2" });
    item = await table1.getItem("xxx");
    expect(item.name).toEqual("test2");
  });

  describe("query()", () => {
    it("handles error", async () => {
      const db = dbCreate({ ...dbConfig, user: "unknown" });

      const res = await db.query("");
      expect(res).toBe(null);
    });
  });

  describe("execute()", () => {
    it("handles error", async () => {
      const db = dbCreate({ ...dbConfig, user: "unknown" });

      const res = await db.execute("");
      expect(res).toBe(null);
    });
  });

  describe("load()", () => {
    let database;

    beforeEach(async () => {
      database = dbCreate({ descriptor, ...dbConfig });
      await database.delete();
    });

    it("builds the schema by default", async () => {
      await database.load();

      const exists = await database.isTableExists("table1");
      expect(exists).toEqual(true);
    });

    it("can skip building schema", async () => {
      await database.load(false);

      const exists = await database.isTableExists("table1");
      expect(exists).toEqual(false);
    });
  });
});
