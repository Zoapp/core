/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import Table from "../table";

export default class MemTable extends Table {
  constructor({ database, name, query }) {
    super({ database, name, query });
  }

  async nextItem(callback) {
    if (this.database.cache && this.database.cache[this.name]) {
      if (this.query) {
        const array = this.getItems(this.query);
        array.forEach(item => callback(item));
      } else {
        const table = this.database.cache[this.name];
        const keys = Object.keys(table);
        const size = keys.length;
        if (size > 0) {
          if (callback) {
            keys.some((k) => {
              const v = table[k];
              return callback(v);
            });
          }
        }
      }
    }
  }

  async setItem(itemname, value) {
    let table = this.database.cache[this.name];
    if (!table) {
      table = {};
      this.database.cache[this.name] = table;
    }
    let iname = itemname;
    if (!itemname) {
      iname = value.id;
    }
    this.database.cache[this.name][iname] = { ...value };
    if (!this.database.lock) {
      this.database.flush();
    }
    return iname;
  }

  async getItems(queryName = null) {
    const table = this.database.cache[this.name];
    let array = [];
    // logger.info("getItems", queryName, table);
    if (table) {
      if (queryName) {
        const query = this.database.buildQuery(queryName);
        array = Object.keys(table).filter(k => query.execute(table[k]));
      } else {
        Object.keys(table).forEach(k => array.push(table[k]));
      }
    }
    return array;
  }

  async getItem(queryName) {
    const table = this.database.cache[this.name];
    let item = null;
    if (queryName.indexOf("=") !== -1) {
      // Build query
      const query = this.database.buildQuery(queryName);
      if (table) {
        const res = Object.keys(table).filter(k => query.execute(table[k]));
        if (res.length === 1) {
          [item] = res;
        }
      }
    } else if (table && table[queryName]) {
      item = { ...table[queryName] };
    }
    return item;
  }

  async deleteItems(queryName) {
    if (queryName.indexOf("=") !== -1) {
      const table = this.database.cache[this.name];
      // Build query
      const query = this.database.buildQuery(queryName);
      if (table) {
        const t = Object.keys(table).filter(k => !query.execute(table[k]));
        this.database.cache[this.name] = t;
        if (!this.database.lock) {
          this.database.flush();
        }
        return true;
      }
      throw new Error(`MemTable deleteItems: Unknown table ${this.name}`);
    }
    return this.deleteItem(queryName);
  }

  async deleteItem(itemname) {
    const table = this.database.cache[this.name];
    if (table && table[itemname]) {
      delete table[itemname];
      if (!this.database.lock) {
        this.database.flush();
      }
      return true;
    }
    throw new Error(`MemTable deleteItem: Unknown item name ${itemname}`);
  }

  async moveItem(itemname, fromIndex, to, query = null) {
    const itemToMove = await this.getItem(itemname);
    if (!itemToMove) {
      throw new Error(`MemTable moveItem: Unknown item name ${itemname}`);
    }

    const table = {};
    const offset = fromIndex >= to ? 0 : -1;
    let index = 0;
    const array = this.getItems(query);
    if (array) {
      // logger.info("array=" + JSON.stringify(array));
      array.forEach((item) => {
        const key = item.id;
        // logger.info("key=" + key);
        if (itemname !== key) {
          if (to === index + offset) {
            table[itemname] = itemToMove;
          }
          table[key] = item;
        }
        index += 1;
      });
    }

    // logger.info("index=" + index + " to=" + to);
    if (to === index) {
      table[itemname] = itemToMove;
    }
    // logger.info("movedTable=" + JSON.stringify(table));
    this.database.cache[this.name] = table;
    if (!this.database.lock) {
      this.database.flush();
    }
    return true;
  }

  async size(query = null) {
    let size = 0;
    if (!query) {
      const table = this.database.cache[this.name];
      if (table) {
        size = Object.keys(table).length;
      }
    }
    // TODO ize with query
    return size;
  }
}
