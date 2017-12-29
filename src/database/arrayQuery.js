/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const OP_OR = true;
const OP_AND = false;
const OP_NONE = 0;
const OP_EQ = 6;
const OP_NQ = 5;
const OP_GT = 4;
const OP_LT = 3;
const OP_GTE = 2;
const OP_LTE = 1;
const operands = ["<=", ">=", "<", ">", "!=", "="];
const operandsOffset = [2, 2, 1, 1, 2, 1];

class ArrayQuery {
  constructor(query) {
    this.query = query;
    this.cmps = [];
    // WIP build ops
    // an ops=[key [op value] ][cond]
    const len = query.length;
    let i = 0;

    let key = null;
    let value = null;
    let op = OP_NONE;
    let buffer = "";
    let offset = 1;
    let p = 0;
    let prev = null;
    let space = false;
    while (i < len) {
      const c = query.charCodeAt(i);
      const n = i < len - 1 ? query.charCodeAt(i + 1) : 0;
      const o = ArrayQuery.nextIsOperand(c, n);
      // logger.info("c=" + c + " n=" + n + " o=" + o);
      if (prev !== null && space) {
        // logger.info("associate=", buffer);
        if (buffer === "and" || buffer === "AND" || (c === 38 && n === 38)) {
          prev.associate = OP_AND;
          buffer = "";
          prev = null;
        } else if (buffer === "or" || buffer === "OR" || (c === 124 && n === 124)) {
          prev.associate = OP_OR;
          buffer = "";
          prev = null;
        }
      }
      if (o !== OP_NONE) {
        // We got Operand in 'o' so buffer must be key
        if (
          prev == null && key == null && buffer.length > 0 && op === OP_NONE
        ) {
          key = buffer;
          buffer = "";
          op = o;
          // logger.info(`operand=${op}`);
        } else {
          logger.info(`Syntax error : wrong operand at line ${i}`);
        }
        offset = operandsOffset[o - 1];
      } else if (ArrayQuery.isAlphaNum(c)) {
        // We got an alphanum we put it in buffer
        buffer += query.charAt(i);
        space = false;
        // logger.info(`buffer=${buffer}`);
      } else if ((p !== 32 && c === 32) || n === 0) {
        // Space or EOF
        // logger.info("space || EOF");
        // logger.info("buffer=", buffer);
        if (key != null && op !== OP_NONE && value === null) {
          // logger.info("value=", buffer);
          value = buffer;
          buffer = "";
        }
        space = true;
      } else if (prev !== null) {
        if (c === 38 && n === 38) {
          buffer = "and";
          space = false;
        } else if (c === 124 && n === 124) {
          buffer = "or";
          space = false;
        }
      } else {
        logger.info(`Unknown character at line ${i} ${c}`);
      }

      if (key != null && op !== OP_NONE && (value !== null || n === 0)) {
        value = value === null ? buffer : value;
        const cmd = { key, op, value };
        // logger.info(`cmd=${JSON.stringify(cmd)}`);
        this.cmps.push(cmd);
        key = null;
        op = OP_NONE;
        value = null;
        prev = cmd;
        space = false;
      }
      // logger.info(`offset=${offset} i=${i} len=${len} n=${n}`);
      p = c;
      i += offset;
      offset = 1;
    }
  }

  static operandString(op) {
    return operands[op - 1];
  }

  static nextIsOperand(c, next) {
    if (c === 61) {
      // =
      return OP_EQ;
    } else if (c === 60) {
      // <
      if (next === 61) {
        // =
        return OP_LTE;
      }
      return OP_LT;
    } else if (c === 62) {
      // >
      if (next === 61) {
        // =
        return OP_LTE;
      }
      return OP_LT;
    } else if (c === 33 && next === 61) {
      // !=
      return OP_NQ;
    }
    return OP_NONE;
  }

  static isAlphaNum(char) {
    // numeric \ A-Z \ a-z \ -_
    return (
      (char > 47 && char < 58) ||
      (char > 64 && char < 91) ||
      (char > 96 && char < 123) ||
      char === 45 ||
      char === 95
    );
  }

  execute(obj) {
    let ret = false;
    let p = false;
    let a = OP_OR;
    this.cmps.forEach((cmp) => {
      const v1 = obj[cmp.key];
      // logger.info("v1=" + v1);
      const v2 = cmp.value;
      let r = false;
      if (v1) {
        r = !!(v1 === v2 && cmp.op === OP_EQ);
        r = !!(r || (v1 !== v2 && cmp.op === OP_NQ));
        r = !!(r || (v1 > v2 && cmp.op === OP_GT));
        r = !!(r || (v1 < v2 && cmp.op === OP_LT));
        r = !!(r || (v1 >= v2 && cmp.op === OP_GTE));
        r = !!(r || (v1 <= v2 && cmp.op === OP_LTE));
      }

      // logger.info("r=" + r);
      ret = a ? r || p : r && p;
      // logger.info("ret=" + ret);
      p = r;
      a = cmp.associate;
    });
    return ret;
  }
}
export default ArrayQuery;
