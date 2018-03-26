import setupLogger from "zoapp-core/helpers/logger";
import dbCreate from "zoapp-core/database";

import { dbConfig } from "./test-config";

setupLogger("test");

let db;

beforeAll(() => {
  db = dbCreate(dbConfig);
});

afterAll(async () => {
  await db.delete();
});
