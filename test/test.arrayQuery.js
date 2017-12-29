/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { assert } from "chai";
import ArrayQuery from "../src/database/arrayQuery";
import setupLogger from "../src/helpers/logger";

setupLogger("test");

describe("ArrayQuery", () => {
  it("key=value", () => {
    const query = new ArrayQuery("key=value");
    let result = query.execute({ key: "value" });
    assert.isTrue(result, "key=value");
    result = query.execute({ key: "notvalue" });
    assert.isFalse(result, "key=notvalue");
    result = query.execute({ notkey: "value" });
    assert.isFalse(result, "notkey=value");
  });
  it("key!=value", () => {
    const query = new ArrayQuery("key!=value");
    let result = query.execute({ key: "value" });
    assert.isFalse(result, "key=value");
    result = query.execute({ key: "notvalue" });
    assert.isTrue(result, "key=notvalue");
    result = query.execute({ notkey: "value" });
    assert.isFalse(result, "notkey=value");
  });
});
