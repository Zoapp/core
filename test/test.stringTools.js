/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { assert, expect } from "chai";
import RandomStringGenerator from "../src/helpers/randomStringGenerator";
import StringTools from "../src/helpers/stringTools";

describe("Helpers", () => {
  it("generate RandomStringGenerator generate", () => {
    const rand = new RandomStringGenerator();
    let len = 0;
    let randString = rand.generate(len);
    expect(randString).to.have.lengthOf(len);

    len = 4;
    randString = rand.generate(len);
    expect(randString).to.have.lengthOf(len);
    randString = rand.generate(len);
    expect(randString).to.have.lengthOf(len);
    randString = rand.generate(len);
    expect(randString).to.have.lengthOf(len);
    randString = rand.generate(len);
    expect(randString).to.have.lengthOf(len);

    len = 64;
    randString = rand.generate(len);
    expect(randString).to.have.lengthOf(len);
    randString = rand.generate(len);
    expect(randString).to.have.lengthOf(len);
    randString = rand.generate(len);
    expect(randString).to.have.lengthOf(len);
    randString = rand.generate(len);
    expect(randString).to.have.lengthOf(len);

    len = 254;
    randString = rand.generate(len);
    expect(randString).to.have.lengthOf(len);
    randString = rand.generate(len);
    expect(randString).to.have.lengthOf(len);
    randString = rand.generate(len);
    expect(randString).to.have.lengthOf(len);
    randString = rand.generate(len);
    expect(randString).to.have.lengthOf(len);
  });

  it("test stringIsEmpty", () => {
    assert.isTrue(StringTools.stringIsEmpty(null), "null test");
    assert.isTrue(StringTools.stringIsEmpty([]), "array test");
    assert.isTrue(StringTools.stringIsEmpty("  "), "trim test");
    assert.isTrue(StringTools.stringIsEmpty(""), "empty test");
    assert.isFalse(StringTools.stringIsEmpty("toto  "), "string test");
  });

  it("test emails", () => {
    assert.isFalse(StringTools.isEmail(""), "Empty string not an email");
    assert.isFalse(StringTools.isEmail("toto"), "Empty string not an email");
    assert.isTrue(StringTools.isEmail("t@g.co"), "minimal email");
    assert.isTrue(StringTools.isEmail("t.t@g.co"), "point email");
    assert.isTrue(StringTools.isEmail("t.t@g.co  "), "trim email");
  });

  it("string strcasecmp", () => {
    assert.isTrue(StringTools.strcasecmp("toto", "toto ") === 0, "Trim string");
    assert.isFalse(StringTools.strcasecmp("toto", "tutu") === 0, "toto is not toto");
    assert.isTrue(StringTools.strcasecmp("toto", "TOTO") === 0, "TOTO is toto");
    assert.isTrue(StringTools.strcasecmp("", " ") === -1, "space is trim");
  });
});
