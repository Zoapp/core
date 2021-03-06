/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import mysql from "mysql2/promise";
import Database from "../database";
import MySQLTable from "./mysqlTable";

export default class MySQLDatabase extends Database {
  constructor({
    host,
    name,
    user,
    password,
    config,
    descriptorFile,
    descriptor,
    parent,
  }) {
    super({
      name,
      descriptorFile,
      descriptor,
      parent,
    });
    this.datatype = "mysql";
    this.config = config || {};
    this.host = host;
    this.user = user;
    this.password = password;
    this.lock = false;
    this.connecting = false;
    const dbname = parent ? this.parent.name : this.name;
    this.dbname = MySQLDatabase.buildDbName(dbname);
    this.conf = {
      host: this.host,
      user: this.user,
      password: this.password,
      database: this.name,
      dateStrings: true, // To fix mysql2 UTC mess see : https://github.com/sidorares/node-mysql2/issues/262
    };
  }

  static buildDbName(n) {
    return `\`${n}\``; // TODO mysql escape characters
  }

  getDataset() {
    return this.dataset;
  }

  reconnect(conf, delay) {
    if (this.connecting) {
      return this.connection;
    }
    this.connecting = true;
    this.delay = delay + 1000;
    if (this.delay > 20000) {
      /* eslint-disable no-undef */
      logger.warn("MySQLDatabase connection timeout, needs to exit process");
      Process.exit(1);
      /* eslint-enable no-undef */
    }
    const that = this;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        // logger.info("reconnect ", delay);
        that
          .createConnection(conf, true)
          .then((cnx) => {
            that.connecting = false;
            resolve(cnx);
          })
          .catch(() => {
            reject();
          });
      }, delay);
    });
  }

  async createFirstConnection(conf) {
    const that = this;
    this.connection = await mysql.createConnection(conf);
    this.connection.connect((error) => {
      if (error) {
        that.close().then(() => {
          logger.info("MySQLDatabase connection closed");
        });
      }
    });
    this.connection.on("error", () => {
      that.close().then(() => {
        logger.info("MySQLDatabase connection closed");
      });
    });
    return this.connection;
  }

  async createConnection(conf, reco = false) {
    const that = this;
    try {
      this.connection = await mysql.createConnection(conf);
    } catch (e) {
      logger.error("error while connecting to MySQLDatabase:", e.code);
      if (!reco) {
        return null; // this.reconnect(conf, this.delay || 5000);
      }
      logger.warn("TODO Need to wait for previous reconnection");
      return this.connection;
    }

    this.connection.connect((error) => {
      if (error) {
        logger.info("error when connecting to MySQLDatabase:", error.code);
        // that.reconnect().then().catch( process.exit(1));
        that.close().then(() => {
          logger.info("MySQLDatabase connection closed");
        });
      }
    });

    this.connection.on("error", (error) => {
      logger.info("MySQLDatabase error=", error.code);
      /* if (error.code === "PROTOCOL_CONNECTION_LOST") {
        that.reconnect().then().catch( process.exit());
      } else {
        throw error;
        // process.exit(1);
      } */
      that.close().then(() => {
        logger.info("MySQLDatabase connection closed");
      });
    });

    return this.connection;
  }

  async load(buildSchema = true) {
    if (this.connection) {
      await this.close();
    }
    if (!this.parent) {
      try {
        this.connection = await this.createFirstConnection(this.conf);
      } catch (e) {
        logger.info("need to create database");
        const cf = { ...this.conf };
        delete cf.database;
        await this.createConnection(cf);
        await this.query(`CREATE DATABASE IF NOT EXISTS ${this.dbname}`);
        await this.query(`USE ${this.dbname};`);
      }
      await this.query("SET time_zone = '+00:00';"); // force this session to be UTC
    }

    if (buildSchema) {
      await this.build();
    }
  }

  /**
   * @param {string} migrationLogTable - The name of the table that log migrations done.
   * @param {*} migrationId - The id of the migration. Must be unique.
   * @param {string} migrationName  - The name of the migration, without space, must be unique.
   * @param {array} queries - An array of SQL queries.
   * The migration queries will be applied if migrationName is not already logged in migrationLogTable.
   */
  async applyMigration(migrationLogTable, migrationId, migrationName, queries) {
    const table = this.getTable(migrationLogTable);
    const count = await table.size(`name=${migrationName}`);
    if (count === 0) {
      // make migration
      logger.info("apply migration", migrationName);
      queries.forEach((query) => {
        this.query(query);
      });
      // log migration
      await table.setItem(null, {
        id: migrationId,
        name: migrationName,
        run_on: Date(),
      });
    }
  }

  async close() {
    if (!this.parent && this.connection) {
      const c = this.connection;
      this.connection = null;
      try {
        await c.end();
        logger.info("MYSQLDatabase close end");
      } catch (e) {
        logger.info("MYSQLDatabase close error");
      }
      logger.info("MYSQLDatabase closed");
    }
  }

  async delete() {
    await this.getConnection();
    if (!this.parent && this.connection) {
      await this.query(`DROP DATABASE IF EXISTS ${this.dbname}`);
      await this.close();
    }
  }

  async reset() {
    await this.getConnection();
    if (!this.parent && !this.connection) {
      await this.load();
    }
    // reset all tables
    const names = this.getCollectionNameList();
    if (!names) {
      return;
    }
    let query = "SET FOREIGN_KEY_CHECKS = 0;";
    await this.query(query);
    const p = [];
    names.forEach((name) => {
      const table = this.getTable(name);
      p.push(table.reset());
    });
    await Promise.all(p);
    query = "SET FOREIGN_KEY_CHECKS = 1;";
    await this.query(query);
    await this.build(names);
  }

  /* eslint-disable no-restricted-syntax */
  /* eslint-disable no-await-in-loop */
  async build(names = this.getCollectionNameList()) {
    // build tables from descriptor collections
    if (names) {
      for (const name of names) {
        // Validate name
        const table = this.getTable(name);
        await table.create();
      }
    }
  }
  /* eslint-enable no-restricted-syntax */
  /* eslint-enable no-await-in-loop */

  async openConnection() {
    if (this.parent) {
      await this.parent.openConnection();
    } else {
      await this.createConnection(this.conf);
    }
  }

  closeConnection() {
    if (this.parent) {
      this.parent.closeConnection();
    } else {
      this.close().then();
    }
  }

  async restartConnection() {
    this.closeConnection();
    await this.openConnection();
  }

  async getConnection() {
    if (this.parent) {
      return this.parent.getConnection();
    }

    if (!this.connection) {
      return this.createConnection(this.conf);
    }

    return this.connection;
  }

  async query(sql) {
    try {
      const con = await this.getConnection();

      if (!con) {
        throw new Error("no connection available");
      }

      if (sql && sql.trim().length > 0) {
        return con.query(sql);
      }
      throw new Error("Empty query");
    } catch (e) {
      logger.log("error", "error in query: %s", e.message, { query: sql });
    }
    return null;
  }

  async execute(sql, fields) {
    try {
      const con = await this.getConnection();

      if (!con) {
        throw new Error("no connection available");
      }

      if (fields && sql && sql.trim().length > 0) {
        return con.execute(sql, fields);
      }
      throw new Error("Empty query");
    } catch (e) {
      logger.log("error", "error in execute: %s", e.message, {
        query: sql,
        fields,
      });
    }
    return null;
  }

  async isTableExists(tableName) {
    const query = `SHOW TABLES FROM ${this.dbname} LIKE '${tableName}';`;

    let v = false;
    const [rows] = await this.query(query);
    if (Array.isArray(rows) && rows.length > 0) {
      v = true;
    }
    return v;
  }

  /* eslint-disable no-restricted-syntax */
  /* eslint-disable no-await-in-loop */
  async exists() {
    const names = this.getCollectionNameList();
    let v = true;
    if (names) {
      for (const name of names) {
        // logger.info("isTableExists", name);
        v = v && (await this.isTableExists(name));
      }
    }
    return v;
  }

  getTable(tablename, query = null) {
    return new MySQLTable({ database: this, name: tablename, query });
  }

  /* eslint-disable no-unused-vars */
  /* eslint-disable class-methods-use-this */
  async setTable(tablename, array) {
    throw new Error("Database setTable: Need to implement it");
  }
}
