/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

export default class StringTools {
  static strcasecmp(str1, str2) {
    const st1 = str1 ? str1.toLowerCase().trim() : null;
    const st2 = str2 ? str2.toLowerCase().trim() : null;
    if (str1 == null || str1.length === 0) {
      return -1;
    }
    if (str2 == null || str2.length === 0) {
      return 1;
    }

    if (st1 > st2) {
      return 1;
    } else if (st1 === st2) {
      return 0;
    }
    return -1;
  }

  static stringIsEmpty(str) {
    return typeof str === "string" ? str.trim().length < 1 : true;
  }

  // see https://github.com/symfony/validator/blob/master/Constraints/EmailValidator.php
  static isEmail(email) {
    let ret = false;
    if (!StringTools.stringIsEmpty(email)) {
      ret = /^[a-zA-Z0-9.!#$%&'*+\\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(
        email.trim(),
      );
    }
    return ret;
  }
}
