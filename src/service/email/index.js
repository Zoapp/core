/**
 * Copyright (c) 2015-present, CWB SAS
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { createTransport } from "nodemailer";

export default class EmailService {
  constructor(parameters) {
    // TODO check parameters
    this.parameters = parameters;
  }

  static getParametersSchema() {
    return {
      host: { type: "string" },
      port: { type: "number" },
      secure: { type: "boolean" },
      auth: {
        type: "object",
        child: {
          user: { type: "string" },
          pass: { type: "string" },
        },
      },
      defaultParams: {
        type: "object",
        child: {
          from: { type: "string" },
        },
      },
    };
  }

  static validateParameters(
    parameters,
    schema = EmailService.getParametersSchema(),
  ) {
    try {
      Object.entries(schema).forEach(([ks, { type, child }]) => {
        const p = Object.entries(parameters).find(([k]) => ks === k);
        if (!p) {
          throw new Error(`Missing property ${ks}`);
        }

        const [, vp] = p;

        // eslint-disable-next-line valid-typeof
        if (!(typeof vp === type)) {
          throw new Error(`Property ${ks} must be an instance of ${type}`);
        }

        if (type === Object) {
          this.validateParameters(vp, child);
        }
      });
    } catch (error) {
      throw new Error(`Invalid smtp parameters: ${error.message}`);
    }
  }

  async open(parameters = this.parameters) {
    try {
      EmailService.validateParameters(parameters);
      this.transporter = createTransport(parameters, parameters.defaultParams);
      await this.transporter.verify();
    } catch (error) {
      throw new Error(`Can't configure SMTP, ${error.message}`);
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
      throw new Error(`Can't send this message: ${error.message}`);
    }
  }
}
