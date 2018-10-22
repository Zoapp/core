/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { createTransport } from "nodemailer";

export default class {
  constructor(parameters) {
    // TODO check parameters
    this.parameters = parameters;
  }

  async open(parameters = this.parameters) {
    const smtpConfig = {
      host: parameters.host,
      port: parameters.port,
      secure: true,
      auth: {
        user: parameters.username,
        pass: parameters.password,
      },
    };

    this.transporter = createTransport(smtpConfig);
    try {
      await this.transporter.verify();
    } catch (error) {
      throw new Error("can`t configure SMTP ", error);
    }
    if (this.parameters !== parameters) {
      this.parameters = parameters;
    }
  }

  async close() {
    if (this.transporter) {
      this.transporter = null;
    }
  }

  async sendMessage(message) {
    // TODO check message parameters
    try {
      await this.transporter.sendMail(message);
    } catch (error) {
      throw new Error("can't send this message ", error);
    }
  }
}
