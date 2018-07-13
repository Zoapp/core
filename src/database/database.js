/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
/* eslint-disable no-unused-vars */
/* eslint-disable class-methods-use-this */

import RandomStringGenerator from "../helpers/randomStringGenerator";
import { loadJsonSync } from "../helpers/fileTools";
import ArrayQuery from "./arrayQuery";

class Database {
  /**
   * Abstract Db Storage
   *
   * @param string url
   */
  constructor({ url, name, version, descriptorFile, descriptor, parent }) {
    let n = name;
    if (!name) {
      n = url;
    }
    let v = version;
    if (!version) {
      v = 1;
    }
    this.url = url;
    this.name = n;
    this.version = v;
    this.parent = parent;
    this.rand = new RandomStringGenerator();
    if (descriptorFile) {
      this.loadDescriptor(descriptorFile);
    } else if (descriptor) {
      this.descriptor = descriptor;
    }
    this.queries = {};
  }

  buildQuery(queryName) {
    let query = this.queries[queryName];
    if (!query) {
      query = new ArrayQuery(queryName);
      this.queries[queryName] = query;
    }
    return query;
  }

  /**
   * Return list of collection's name without nested ones.
   */
  getCollectionNameList() {
    let collectionNameList = null;
    // logger.info("descriptor=", this.descriptor);
    if (this.descriptor && this.descriptor.properties) {
      collectionNameList = Object.keys(this.descriptor.properties).filter(
        (name) => {
          const property = this.descriptor.properties[name];
          return !property.nested;
        },
        this,
      );
      // logger.info(JSON.stringify(collectionNameList));
    }
    return collectionNameList;
  }

  getCollectionDescription(collectionName) {
    let desc = null;
    if (this.descriptor && this.descriptor.properties) {
      desc = this.descriptor.properties[collectionName];
      // logger.info("desc=" + desc, collectionName);
    }
    return desc;
  }

  setDescriptor(d) {
    this.descriptor = d;
  }

  async loadDescriptor(descriptorFile) {
    const data = loadJsonSync(descriptorFile);
    this.setDescriptor(data);
    return this.descriptor;
  }

  async load() {
    throw new Error("Database load: Need to superclass it");
  }

  async delete() {
    throw new Error("Database delete: Need to superclass it");
  }

  async reset() {
    throw new Error("Database reset: Need to superclass it");
  }

  put(source, collectionName) {
    const collectionSource = source.getTable(collectionName);
    this.lock();
    const collection = this.getTable(collectionName);
    collection.create();
    if (collectionSource) {
      collectionSource.nextItem((item) => {
        if (item.id) {
          collection.setItem(null, item);
        }
      });
    }
    this.flush();
  }

  async migrate(source) {
    const collectionNameList = this.getCollectionNameList();
    collectionNameList.forEach((name) => {
      this.put(source, name);
    });
  }

  async applyMigration(migrationLogTable, migrationId, migrationName, queries) {
    throw new Error("Database applyMigration: Need to superclass it");
  }

  getName() {
    return this.name;
  }

  async isTableExists(tableName) {
    throw new Error("Database isTableExists: Need to superclass it");
  }

  async exists() {
    throw new Error("Database exists: Need to superclass it");
  }

  lock() {
    this.lock = true;
  }

  flush() {
    this.lock = false;
  }

  async setTable(tablename, array) {
    throw new Error("Database setTable: Need to superclass it");
  }

  getTable(tablename, query = null) {
    throw new Error("Database getTable: Need to superclass it");
  }

  generateToken(length) {
    return this.rand.generate(length);
  }
}

export default Database;
