// default test config

export const descriptor = {
  title: "test",
  description: "JSON schema for Zoapp-Core test",
  $schema: "http://json-schema.org/draft-04/schema#",
  type: "object",
  definitions: {
    Id: {
      type: "string",
    },
    DateTime: {
      type: "string",
    },
    Timestamp: {
      type: "integer",
    },
    Link: {
      type: "string",
    },
    Map: {
      type: "object",
    },
    Order: {
      type: "integer",
    },
  },
  properties: {
    table1: {
      title: "Table1",
      properties: {
        id: {
          type: "#Id",
        },
        name: {
          type: "string",
          size: 50,
        },
        creation_date: {
          type: "#DateTime",
        },
        timestamp: {
          type: "#Timestamp",
        },
        value: {
          type: "integer",
        },
        flag: {
          type: "boolean",
        },
        obj: {
          type: "object",
        },
        map: {
          type: "#Map",
        },
        list: {
          type: "array",
        },
        refId: {
          type: "#Link",
        },
        order: {
          type: "#Order",
        },
      },
    },
    migrationTable: {
      title: "MigrationTable",
      properties: {
        id: {
          type: "#Id",
        },
        name: {
          type: "string",
        },
        run_on: {
          type: "#DateTime",
        },
      },
    },
  },
};

export const dbConfig = {
  datatype: "mysql",
  host: "localhost",
  name: "test",
  user: "root",
};
