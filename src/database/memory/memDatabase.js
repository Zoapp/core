/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import Database from "../database";
import MemTable from "./memTable";

export default class MemDatabase extends Database {
  constructor({ name, descriptorFile, parent }) {
    super({ name, descriptorFile, parent });
    this.cache = {};
    this.lock = false;
  }

  async load() {
    this.loaded = true;
  }

  async close() {
    this.loaded = false;
  }

  async applyMigration(migrationLogTable, migrationId, migrationName) {
    const table = this.getTable(migrationLogTable);
    const mig = await table.getItem(`name=${migrationName}`);
    if (!mig) {
      // log migration
      await table.setItem(null, {
        id: migrationId,
        name: migrationName,
        run_on: Date(),
      });
    }
  }

  async isTableExists(tableName) {
    return !!this.cache[tableName];
  }

  async exists() {
    return Object.keys(this.cache).length === 0;
  }

  async setTable(tablename, array) {
    this.cache[tablename] = [...array];
    return true;
  }

  async getArray(tablename) {
    let array = null;
    if (this.cache[tablename]) {
      array = [...this.cache[tablename]];
    }
    return array;
  }

  getTable(tablename, query) {
    const table = new MemTable({ database: this, name: tablename, query });
    return table;
  }

  async delete() {
    this.cache = {};
  }

  async reset() {
    Object.keys(this.cache).forEach((name) => {
      this.cache[name] = []; // reset table
    }, this);
  }
}
