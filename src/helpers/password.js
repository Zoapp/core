/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import crypto from "crypto";
import StringTools from "./stringTools";

export default class Password {
  // Minimal password strength validator
  static strength(password) {
    let strength = 0;
    if (StringTools.stringIsEmpty(password)) {
      const regex = [
        "[A-Z]",       // Uppercase Alphabet.
        "[a-z]",       // Lowercase Alphabet.
        "[0-9]",       // Digit.
        "[$@$!%*#?&]", // Special Character.
      ];
      regex.forEach((reg) => {
        if (reg.test(password)) {
          strength += 1;
        }
      });
      if (strength > 2 && password.length > 8) {
        strength += 1;
      }
    }
    return strength;
  }

  // Not secure at all SaltHash generator
  static generateSaltHash(password, salt = null) {
    // TODO salthash
    let hash = null;
    if (salt) {
      const sha512sum = crypto.createHmac("sha512", salt);
      sha512sum.update(password);
      hash = hash.digest("hex");
    } else {
      const sha1sum = crypto.createHash("sha1");
      sha1sum.update(password);
      hash = sha1sum.digest("hex");
    }
    return hash;
  }

}
