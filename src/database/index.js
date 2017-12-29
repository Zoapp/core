/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import mySQLDatabase from "./mysql";
import fileDatabase from "./file";
import memDatabase from "./memory";

export default ({
  datatype,
  host,
  filename,
  name,
  user,
  password,
  descriptorFile,
  descriptor,
  parent,
}) => {
  let db = null;
  let dt = datatype;
  if (parent && (!dt)) {
    dt = parent.datatype;
  }
  if (dt && dt === "mysql" && name) {
    db = mySQLDatabase({
      host, name, user, password, descriptorFile, descriptor, parent,
    });
  } else if (filename) {
    db = fileDatabase({
      filename, name, descriptorFile, descriptor, parent,
    });
  } else {
    db = memDatabase({
      name, descriptorFile, descriptor, parent,
    });
  }
  return db;
};
