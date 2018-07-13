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
    it("should return table content", async () => {
      const database = dbCreate({ descriptor, ...dbConfig });
      await database.reset();

      const exists = await database.exists();
      expect(exists).toBe(true);

      const table1 = database.getTable("table1");
      await Promise.all(
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
        ].map(async (item) => {
          await table1.setItem(null, {
            id: item.name,
            name: item.name,
            order: item.order,
          });
        }),
      );

      // select names
      const res = await database.query("SELECT name FROM table1");
      const names = res[0].map((row) => row.name);
      expect(names).toEqual(["it-3", "it-2", "it-1"]);
    });

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

  describe("applyMigration()", () => {
    it("make new migration", async () => {
      const database = dbCreate({ descriptor, ...dbConfig });
      await database.reset();

      expect(await database.isTableExists("migrationTable")).toEqual(true);
      const migrationTable = database.getTable("migrationTable");
      expect(await migrationTable.size()).toBe(0);

      await database.applyMigration("migrationTable", "1", "migration_1", []);
      expect(await migrationTable.size()).toBe(1);

      await database.applyMigration("migrationTable", "2", "migration_2", []);
      expect(await migrationTable.size()).toBe(2);
    });

    it("should run a migration only once", async () => {
      const database = dbCreate({ descriptor, ...dbConfig });
      await database.reset();

      expect(await database.isTableExists("migrationTable")).toEqual(true);
      const migrationTable = database.getTable("migrationTable");
      expect(await migrationTable.size()).toBe(0);

      await database.applyMigration("migrationTable", "1", "migration_1", []);
      expect(await migrationTable.size()).toBe(1);

      await database.applyMigration("migrationTable", "1", "migration_1", []);
      expect(await migrationTable.size()).toBe(1);
    });
  });
});
