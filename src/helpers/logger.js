import winston from "winston";

global.logger = null;

export default (env = "", dirname = "", filename = "app.log") => {
  logger = new winston.Logger();
  switch (env) {
  case "production":
    logger.add(winston.transports.File, {
      filename,
      dirname,
      handleExceptions: true,
      exitOnError: false,
      level: "warn",
    });
    break;
  case "test":
  default:
    logger.add(winston.transports.Console, {
      colorize: true,
      timestamp: true,
      level: "silly",
    });
    break;
  }
  return logger;
};
