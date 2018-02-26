/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import dbCreate from "../src/database";
import setupLogger from "../src/helpers/logger";

setupLogger("test");

const descriptor = {
  title: "test",
  description: "JSON schema for Zoapp-Core test",
  $schema: "http://json-schema.org/draft-04/schema#",
  type: "object",
  definitions: {
    Id: {
      type: "string",
    },
    DateTime: {
      type: "string",
    },
    Timestamp: {
      type: "integer",
    },
    Link: {
      type: "string",
    },
    Map: {
      type: "object",
    },
    Order: {
      type: "integer",
    },
  },
  properties: {
    table1: {
      title: "Table1",
      properties: {
        id: {
          type: "#Id",
        },
        name: {
          type: "string",
          size: 50,
        },
        creation_date: {
          type: "#DateTime",
        },
        timestamp: {
          type: "#Timestamp",
        },
        value: {
          type: "integer",
        },
        flag: {
          type: "boolean",
        },
        obj: {
          type: "object",
        },
        map: {
          type: "#Map",
        },
        list: {
          type: "array",
        },
        refId: {
          type: "#Link",
        },
        order: {
          type: "#Order",
        },
      },
    },
  },
};

const dbConfig = {
  datatype: "mysql",
  host: "localhost",
  name: "test",
  user: "root",
};

describe("Database", () => {
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
    // Reset it
    await database.reset();
    // Check if exist
    const v = await database.exists();
    expect(v).toBe(true);
    // logger.info("ok we go");

    const table1 = database.getTable("table1");
    // logger.info("ok we set item");
    await table1.setItem(null, {
      id: "xxx",
      name: "test1",
      creation_date: Date.now(),
      timestamp: Date.now(),
      value: 123,
      flag: true,
      refId: "yyy",
      obj: { sub: "sub", text: "text" },
      map: { dist: 0, len: 1 },
      list: ["test1", "test2", "test3"],
    });
    // logger.info("ok we set another item");
    await table1.setItem("xxx", { id: "xxx", name: "test2" });
    const item = await table1.getItem("xxx");
    logger.info("item=", JSON.stringify(item));
  });

  describe("query()", () => {
    it("throws an error when there is no connection available", async () => {
      expect.assertions(1);

      const db = dbCreate({ ...dbConfig, user: "unknown" });

      try {
        await db.query("");
      } catch (e) {
        expect(e.message).toMatch("no connection available");
      }
    });
  });

  describe("execute()", () => {
    it("throws an error when there is no connection available", async () => {
      expect.assertions(1);

      const db = dbCreate({ ...dbConfig, user: "unknown" });

      try {
        await db.execute("");
      } catch (e) {
        expect(e.message).toMatch("no connection available");
      }
    });
  });
});
