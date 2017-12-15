/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */

export default class Table {
  constructor({ database, name, query }) {
    this.database = database;
    this.name = name;
    this.query = query;
  }

  async reset() {
    // Abstract
    throw new Error("Table reset: Need to superclass it");
  }

  async create() {
    // Abstract
    throw new Error("Table create: Need to superclass it");
  }

  async nextItem(callback) {
    // Abstract
    throw new Error("Table nextItem: Need to superclass it");
  }

  async setItem(itemname, value) {
    // Abstract
    throw new Error("Table setItem: Need to superclass it");
  }

  async getItems(queryName = null) {
    // Abstract
    throw new Error("Table getItems: Need to superclass it");
  }

  async getItem(queryName) {
    // Abstract
    throw new Error("Table getItem: Need to superclass it");
  }

  async deleteItems(queryName) {
    throw new Error("Table deleteItems: Need to superclass it");
  }

  async deleteItem(itemname) {
    throw new Error("Table deleteItem: Need to superclass it");
  }

  async moveItem(itemname, from, to, query = null) {
    // Abstract
    throw new Error("Table moveItem: Need to superclass it");
  }

  async size(query = null) {
    // Abstract
    throw new Error("Table size: Need to superclass it");
  }
}
