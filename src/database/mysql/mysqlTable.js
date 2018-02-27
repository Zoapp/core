/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import Table from "../table";
import MySQLDatabase from "./mysqlDatabase";
import ArrayQuery from "../arrayQuery";

export default class MySQLTable extends Table {
  constructor({ database, name, query }) {
    super({ database, name, query });
  }

  async reset() {
    const n = MySQLDatabase.buildDbName(this.name);
    const sql = `DROP TABLE IF EXISTS ${n};`;
    // logger.info(query);
    await this.database.query(sql);
  }

  async exists() {
    const query = `SHOW TABLES FROM ${this.database.dbname} LIKE '${this.name}';`;

    let v = false;
    const [rows] = await this.database.query(query);
    if (Array.isArray(rows) && rows.length > 0) {
      v = true;
    }
    return v;
  }

  async create() {
    const b = await this.exists();
    if (b) {
      return;
    }
    // logger.info("create", this.name);
    const { properties } = this.database.getCollectionDescription(this.name);
    if (!properties) {
      throw new Error(`Undefined properties for this collection ${this.name}`);
    }
    // logger.info("properties", properties);
    const propNames = await Object.keys(properties);
    // logger.info("propNames", propNames);
    let sql = `CREATE TABLE IF NOT EXISTS ${MySQLDatabase.buildDbName(this.name)}`;
    sql += " (`id` binary(16) NOT NULL, id_text varchar(36) generated always as (hex(id)) virtual, ";
    propNames.forEach((n) => {
      const prop = properties[n];
      const vn = MySQLDatabase.buildDbName(n);
      if (n === "id" && prop.type === "#Id") {
        sql += "`idx` varchar(100), ";
      } else if (prop.type === "#DateTime") {
        sql += `${vn} datetime(3), `; // Milliseconds fraction
      } else if (prop.type === "#Link") {
        sql += `${vn} varchar(100), `;
      } else if (prop.type === "#Timestamp") {
        sql += `${vn} bigint(20), `;
      } else if (prop.type === "#Map") {
        // TODO
        sql += `${vn} TEXT, `;
      } else if (prop.type === "string") {
        if (prop.size === "big") {
          sql += `${vn} TEXT, `;
        } else {
          const size = prop.size || 100;
          sql += `${vn} varchar(${size}), `;
        }
      } else if (prop.type === "integer") {
        sql += `${vn} int(11), `;
      } else if (prop.type === "array") {
        // TODO
        sql += `${vn} TEXT, `;
      } else if (prop.type === "object") {
        // TODO
        sql += `${vn} TEXT, `;
      } else if (prop.type === "boolean") {
        sql += `${vn} boolean, `;
      } else if (prop.type === "#Order") {
        sql += `${vn} integer(11), `;
      }
    });
    sql +=
      "PRIMARY KEY (id)) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;";
    // logger.info(sql);
    await this.database.query(sql);
  }

  buildOrderBy() {
    let sort = "";
    const desc = this.database.getCollectionDescription(this.name);
    if (desc.sorted) {
      sort = `ORDER BY \`${desc.sorted}\` ASC`;
    }
    return sort;
  }

  doWhereQuery(queryName, whereStatement = " WHERE ") {
    if (!queryName) {
      return "";
    }
    let where = whereStatement;
    if (queryName.indexOf("=") === -1) {
      where += `\`idx\`='${queryName}'`;
    } else {
      const query = this.database.buildQuery(queryName);
      // WIP create where statement from query
      if (query.where) {
        ({ where } = query);
      } else {
        let prev = null;
        query.cmps.forEach((cmp) => {
          if (prev) {
            // logger.info("associate=", prev.associate ? "OR" : "AND");
            where += prev.associate ? " OR " : " AND ";
          }
          // logger.info("key=", cmp.key);
          let k = cmp.key;
          if (k === "id") {
            k = "idx";
          }
          // TODO check type of value from descriptor
          let op = ArrayQuery.operandString(cmp.op);
          if (cmp.value === "null" || cmp.value === "NULL" || cmp.value === "undefined") {
            op = op === "=" ? "IS" : "IS NOT";
            where += `\`${k}\` ${op} NULL`;
          } else {
            where += `\`${k}\`${ArrayQuery.operandString(cmp.op)}'${cmp.value}'`;
          }
          prev = cmp;
        });
        query.where = where;
        logger.info(" where=", where);
      }
    }
    return where;
  }

  rebind(row) {
    // logger.info("rebind row=", row);
    const { properties } = this.database.getCollectionDescription(this.name);
    const item = {};
    Object.keys(properties).forEach((key) => {
      const value = row[key];
      // logger.info("rebind key=", key, value);
      const { type } = properties[key];

      if (value) {
        if (key === "id") {
          item.id = row.idx;
        } else if (key === "extras") {
          if (value.charAt(0) === "{") {
            const extras = JSON.parse(value);
            Object.keys(extras).forEach((k) => {
              item[k] = extras[k];
            });
          }
        } else if (type === "string") {
          item[key] = value;
        } else if (type === "integer" || type === "#Order") {
          item[key] = Number(value);
        } else if (type === "boolean") {
          item[key] = Boolean(value);
        } else if (type === "#DateTime") {
          item[key] = new Date(`${value} UTC`);
        } else if (type === "#Timestamp") {
          item[key] = new Date(value);
        } else if (type === "#Link") {
          // TODO
          item[key] = value;
        } else if (type === "array") {
          // TODO
          if (value.charAt(0) === "[") {
            item[key] = JSON.parse(value);
          } else if (value && value.indexOf(":") > 0) {
            logger.info("TODO unserialize PHP value", value);
          } else if (value && value.indexOf(",") > 0) {
            item[key] = value.trim().split(/\s*,\s*/);
          } else {
            item[key] = value;
          }
        } else if (type === "object" || type === "#Map") {
          // TODO
          if (value.charAt(0) === "{") {
            item[key] = JSON.parse(value);
          } else {
            if (value && value.indexOf(":") > 0) {
              logger.info("TODO unserialize PHP value", value);
            }
            item[key] = value;
          }
        }
      }
    });
    // logger.info("rebind row=", JSON.stringify(row));
    return item;
  }

  static padNumber(value, len) {
    let v = `${value}`;
    while (v.length < len) {
      v = `0${v}`;
    }
    return v;
  }

  getProperties() {
    return this.database.getCollectionDescription(this.name).properties;
  }

  buildStatement(fields, keys, item, properties = this.getProperties(), size = 0, nullify = false) {
    let extras = null;
    if (properties.extras) {
      extras = {};
      /* keys.forEach((key) => {
        if (!properties[key]) {
          extras[key] = item[key];
        }
      }); */
    }
    keys.forEach((key) => {
      // logger.info("key=", key, properties[key]);
      if (properties[key]) {
        let { type } = properties[key];
        if (key === "idx") {
          type = "string";
        }
        // WIP validate/transform field value
        let value = item[key];
        if (key === "extras") {
          value = JSON.stringify(extras);
          type = "string";
          // logger.info("extras =", value);
        }
        if (value !== undefined && value !== null) {
          if (key === "extras") {
            value = JSON.stringify(extras);
            // logger.info("extras =", value);
          } else if (type === "#DateTime") {
            const date = new Date(value);
            // Y-m-d H:i:s.u
            value = `${date.getUTCFullYear()}-${MySQLTable.padNumber(date.getUTCMonth() + 1, 2)}-${MySQLTable.padNumber(date.getUTCDate(), 2)} ${MySQLTable.padNumber(date.getUTCHours(), 2)}:${MySQLTable.padNumber(date.getUTCMinutes(), 2)}:${MySQLTable.padNumber(date.getUTCSeconds(), 2)}.${MySQLTable.padNumber(date.getUTCMilliseconds(), 3)}`;
          } else if (type === "#Map" || type === "array" || type === "object") {
            // logger.info("typeof=", (typeof value));
            if (value && (Array.isArray(value) || (!(typeof value === "string")))) {
              value = JSON.stringify(value);
            } /* else {
              logger.info("array error", value);
            } */
          } else if (type === "#Order" || type === "number") {
            if (value) {
              value = Number(value);
            } else {
              value = size;
            }
          } else if (type === "#Timestamp") {
            value = Number(value); // With millisec
          } else if (type === "boolean") {
            value = value ? 1 : 0;
          } else if (type === "string") {
            value = value || "";
          } else if (type !== "integer" && type !== "#Link") {
            logger.info("unknown type=", type);
          }
          fields.push(value);
          if (key === "extras") {
            extras = null;
          }
        } else if (nullify) {
          value = null;
        }
      } else if (extras) {
        extras[key] = item[key];
      } else {
        logger.info("Unknown extra value key=", key);
      }
    });
    return fields;
  }

  /* eslint-disable no-await-in-loop */
  /* eslint-disable no-restricted-syntax */
  async nextItem(callback) {
    // TODO optimize fetch SQL
    // TODO sorting
    const sql = `SELECT * FROM ${this.name} ${this.doWhereQuery(this.query)};`;
    const result = await this.database.query(sql);
    // logger.info("result=", result);
    for (const row of result[0]) {
      let item = null;
      if (row) {
        item = this.rebind(row);
        // logger.info("item=", item);
      }
      const r = await callback(item);
      if (r) {
        break;
      }
    }
  }
  /* eslint-enable no-restricted-syntax */
  /* eslint-enable no-await-in-loop */


  async updateItems(items) {
    const properties = this.getProperties();
    const keys = Object.keys(properties);
    let sql = `UPDATE \`${this.name}\` SET `;
    let b = " ";
    keys.forEach((k) => {
      sql += `${b}\`${k}\`=? `;
      b = ", ";
    });
    sql += " WHERE `idx`=?;";

    const promises = [];
    items.forEach((item) => {
      const fields = [];
      this.buildStatement(fields, keys, item, true);
      fields.push(item.id);
      promises.push(this.database.execute(sql, fields));
    });
    await Promise.all(promises);
  }

  async setItem(itemname, value) {
    const properties = this.getProperties();
    let sql = null;
    const { id, ...item } = value;
    // logger.info("item=", JSON.stringify(item));
    const fields = [];
    let i = id;
    const keys = [];
    Object.keys(item).forEach((k) => {
      if (properties[k] || properties.extras) {
        if (item[k] !== undefined && item[k] !== null) {
          keys.push(k);
        }
      } else {
        logger.info("unknown key=", k);
      }
    });
    if (properties.extras) {
      keys.push("extras");
    }
    if (itemname) {
      // Update
      sql = `UPDATE \`${this.name}\` SET `;
      let b = " ";
      keys.forEach((k) => {
        if (properties[k]) {
          sql += `${b}\`${k}\`=? `;
          b = ", ";
        }
      });
      this.buildStatement(fields, keys, item, properties);
      sql += " WHERE `idx`=?;";
      fields.push(itemname);
      i = itemname;
    } else {
      // Create
      sql = `INSERT INTO \`${this.name}\` (\`id\`,\`idx\``;

      let join = "";
      let stm = "";
      keys.forEach((k) => {
        if (properties[k]) {
          join += `,\`${k}\``;
          stm += ",?";
        }
      });
      sql += `${join})`;
      sql += " VALUES (unhex(replace(uuid(),'-','')),?";
      sql += stm;
      sql += ");";
      fields.push(id);
      this.buildStatement(fields, keys, item, properties);
    }
    const result = await this.execute(sql, fields);
    // logger.info("result=", result);
    if (!result) {
      i = null;
    }
    return i;
  }

  async getItems(queryName = null) {
    // WIP
    // TODO sorting
    const sql = `SELECT * FROM ${this.name} ${this.doWhereQuery(queryName)};`;
    const result = await this.database.query(sql);
    const array = [];
    result[0].forEach((row) => {
      let item = null;
      if (row) {
        item = this.rebind(row);
      }
      array.push(item);
    });
    return array;
  }

  async getItem(queryName) {
    // WIP
    const sql = `SELECT * FROM \`${this.name}\`${this.doWhereQuery(queryName)};`;
    // logger.info("sql=", sql);
    const result = await this.database.query(sql);
    // logger.info("getItem result:", result);
    const row = result[0][0];
    let item = null;
    if (row) {
      item = this.rebind(row);
    }
    this.sql = sql;
    this.fields = null;
    return item;
  }

  async deleteItems(queryName) {
    // WIP
    const sql = `DELETE FROM ${this.name} ${this.doWhereQuery(queryName)};`;
    // logger.info("sql=", sql);
    await this.database.query(sql);
    // TODO reorder if necessary
    return true;
  }

  async deleteItem(itemname) {
    // TODO check if ordered and reorder
    return this.deleteItems(itemname);
  }

  async moveItem(itemname, fromIndex, to, query = null) {
    if (fromIndex === to && itemname != null) {
      return true;
    }
    const desc = this.database.getCollectionDescription(this.name);
    const notSorted = !!desc.sorted;
    if (notSorted) {
      const propNames = Object.keys(desc.properties);
      propNames.some((n) => {
        const prop = desc.properties[n];
        if (prop.type === "#Order") {
          desc.sorted = n;
          return true;
        }
        return false;
      });
      if (!desc.sorted) {
        throw new Error("Can't sort this collection sorted property not available", this.name);
      }
    }
    const items = await this.getItems(query);
    if (fromIndex < items.length) {
      if (notSorted) {
        // Reorder all
        if (items.length > 1) {
          let i = 0;
          items.forEach((item) => {
            const it = item;
            it[desc.sorted] = i;
            i += 1;
          }, this);
        }
      }
      return true;
    }
    /*
     This code need to be tested and optimized
     from http://www.barattalo.it/coding/reorder-records-table/
    let where = "";
    if (query) {
      where = ` AND (${this.doWhereQuery(query, "")})`;
    }
    // TODO check if descriptor has an #Order field if not throws an error
    const orderfield = "order"; // remove this hack and get it from descriptor
    if (itemname != null) {
      const update = `UPDATE ${this.name} SET ${orderfield}=${orderfield}`;
      let prev = "<";
      let next = ">=";
      if (fromIndex > to) {
        prev = "<=";
        next = ">";
      }
      this.execute(`${update}-1 WHERE ${orderfield} ${prev} '${to}'
      AND idx<>'${itemname}'${where};`);
      this.execute(`${update}+1 WHERE ${orderfield} ${next} '${to}'
      AND idx<>'${itemname}'${where};`);
      this.execute(`UPDATE ${this.name} SET ${orderfield}=${to} WHERE idx='${itemname}';`);
    } else {
      // Order items
      const result = await this.execute(`SELECT ${orderfield},idx
      FROM ${this.name} WHERE ${where}`);
      let p = 0;
      result.forEach((item) => {
        p += 1;
        this.execute(`UPDATE ${this.name} SET ${orderfield}='${p}'
        WHERE idx= '${item.id}'`);
      });
    }
    */
    return true;
  }

  static pause(milliseconds) {
    const dt = new Date();
    while ((new Date()) - dt <= milliseconds) { /* Do nothing */ }
  }

  /* eslint-disable no-await-in-loop */
  async execute(sql, fields = null) {
    // logger.info("execute");
    this.sql = sql;
    this.fields = fields;
    let result = null;
    if (fields) {
      let i = 0;
      let error = null;
      let run = true;
      while (run) {
        try {
          run = false;
          result = await this.database.execute(sql, fields);
        } catch (e) {
          // logger.info(e);
          error = e;
          run = true;
        }
        // logger.info("run=", run);
        if (run) {
          await this.database.restartConnection();
          MySQLTable.pause(300 * i);
          i += 1;
          if (i > 4) {
            run = false;
            logger.info(error);
            logger.info(this.sql);
            result = null;
          }
        }
      }
    }
    return result;
  }
  /* eslint-enable no-await-in-loop */

  async size(query = null) {
    let s = 0;
    const sql = `SELECT COUNT(id) FROM ${MySQLDatabase.buildDbName(this.name)} ${this.doWhereQuery(query)};`;
    // TODO size with query
    const [result] = await this.database.query(sql);
    s = Number(Object.keys(result)[0]);
    return s;
  }
}
