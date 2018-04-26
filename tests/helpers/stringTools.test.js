/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import RandomStringGenerator from "zoapp-core/helpers/randomStringGenerator";
import StringTools from "zoapp-core/helpers/stringTools";

describe("helpers/stringTools", () => {
  test("generate RandomStringGenerator generate", () => {
    const rand = new RandomStringGenerator();
    let len = 0;
    let randString = rand.generate(len);
    expect(randString).toHaveLength(len);

    len = 4;
    randString = rand.generate(len);
    expect(randString).toHaveLength(len);
    randString = rand.generate(len);
    expect(randString).toHaveLength(len);
    randString = rand.generate(len);
    expect(randString).toHaveLength(len);
    randString = rand.generate(len);
    expect(randString).toHaveLength(len);

    len = 64;
    randString = rand.generate(len);
    expect(randString).toHaveLength(len);
    randString = rand.generate(len);
    expect(randString).toHaveLength(len);
    randString = rand.generate(len);
    expect(randString).toHaveLength(len);
    randString = rand.generate(len);
    expect(randString).toHaveLength(len);

    len = 254;
    randString = rand.generate(len);
    expect(randString).toHaveLength(len);
    randString = rand.generate(len);
    expect(randString).toHaveLength(len);
    randString = rand.generate(len);
    expect(randString).toHaveLength(len);
    randString = rand.generate(len);
    expect(randString).toHaveLength(len);
  });

  test("test stringIsEmpty", () => {
    expect(StringTools.stringIsEmpty(null)).toBe(true);
    expect(StringTools.stringIsEmpty([])).toBe(true);
    expect(StringTools.stringIsEmpty("  ")).toBe(true);
    expect(StringTools.stringIsEmpty("")).toBe(true);
    expect(StringTools.stringIsEmpty("toto  ")).toBe(false);
  });

  test("test emails", () => {
    expect(StringTools.isEmail("")).toBe(false);
    expect(StringTools.isEmail("toto")).toBe(false);
    expect(StringTools.isEmail("t@g.co")).toBe(true);
    expect(StringTools.isEmail("t.t@g.co")).toBe(true);
    expect(StringTools.isEmail("t.t@g.co  ")).toBe(true);
    expect(StringTools.isEmail("t+t@g.co  ")).toBe(true);
  });

  test("string strcasecmp", () => {
    expect(StringTools.strcasecmp("toto", "toto ") === 0).toBe(true);
    expect(StringTools.strcasecmp("toto", "tutu") === 0).toBe(false);
    expect(StringTools.strcasecmp("toto", "TOTO") === 0).toBe(true);
    expect(StringTools.strcasecmp("", " ") === -1).toBe(true);
  });
});
