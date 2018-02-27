/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import ArrayQuery from "zoapp-core/database/arrayQuery";

describe("database/arrayQuery", () => {
  test("key=value", () => {
    const query = new ArrayQuery("key=value");
    let result = query.execute({ key: "value" });
    expect(result).toBe(true);
    result = query.execute({ key: "notvalue" });
    expect(result).toBe(false);
    result = query.execute({ notkey: "value" });
    expect(result).toBe(false);
  });

  test("key!=value", () => {
    const query = new ArrayQuery("key!=value");
    let result = query.execute({ key: "value" });
    expect(result).toBe(false);
    result = query.execute({ key: "notvalue" });
    expect(result).toBe(true);
    result = query.execute({ notkey: "value" });
    expect(result).toBe(false);
  });
});
