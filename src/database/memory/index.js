/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import MemDatabase from "./memDatabase";

export default ({ name, descriptorFile }) =>
  new MemDatabase({ name, descriptorFile });
