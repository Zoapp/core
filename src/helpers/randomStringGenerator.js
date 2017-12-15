/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import crypto from "crypto";

// https://littlemaninmyhead.wordpress.com/2015/11/22/cautionary-note-uuids-should-generally-not-be-used-for-authentication-tokens/

export default class RandomStringGenerator {
  constructor(alphabet) {
    let a = alphabet;
    if (!a) {
      a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    }
    this.setAlphabet(a);
  }

  /**
     * @param string alphabet
     */
  setAlphabet(alphabet) {
    if (!alphabet) {
      return;
    }
    this.alphabet = alphabet;
  }

  /**
     * @param int length
     * @return string
     */
  generate(length) {
    // console.log("[");
    let token = "";

    for (let i = 0; i < length; i += 1) {
      const randomKey = RandomStringGenerator.getRandomInteger(
        0,
        this.alphabet.length,
      );
      token += this.alphabet.charAt(randomKey);
      // console.log(i + " : " + token + " randomkey" + randomKey);
    }
    // console.log("]");
    return token;
  }

  /**
     * @param int min
     * @param int max
     * @return int
     * http://stackoverflow.com/questions/33609404/node-js-how-to-generate-random-numbers-in-specific-range-using-crypto-randomby
     */
  static getRandomInteger(min, max) {
    const range = max - min;

    if (range < 0) {
      // Not so random...
      return -1;
    }
    const maxBytes = 6;
    const maxDec = 281474976710656;
    const randbytes = parseInt(
      crypto.randomBytes(maxBytes).toString("hex"),
      16,
    );
    const rnd = Math.floor(((randbytes / maxDec) * range) + min);
    return rnd;
  }
}
