/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import fs from "fs";

export function fileExistsSync(filepath) {
  try {
    fs.statSync(filepath);
  } catch (err) {
    if (err.code === "ENOENT") {
      return false;
    }
  }
  return true;
}

export function loadJsonSync(filepath) {
  if (!fileExistsSync(filepath)) {
    return null;
  }
  let data = fs.readFileSync(filepath, "utf8");
  if (Buffer.isBuffer(data)) {
    data = data.toString("utf8");
  }
  const json = JSON.parse(data.replace(/^\uFEFF/, ""));
  return json;
}

export function saveJsonSync(filepath, data) {
  const json = JSON.stringify(data);
  fs.writeFileSync(filepath, json, "utf8");
}
